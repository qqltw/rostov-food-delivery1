import express from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

// Global safety nets — so serverless functions return readable errors
// instead of FUNCTION_INVOCATION_FAILED.
process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});

let __filename = '';
let __dirname = process.cwd();
try {
  __filename = fileURLToPath(import.meta.url);
  __dirname = path.dirname(__filename);
} catch {
  // import.meta.url not available — stay with process.cwd()
}

// Lazy Prisma client — instantiation is deferred until first use so that
// import-time errors (missing DATABASE_URL, missing binary) don't crash the whole module.
let _prisma: PrismaClient | null = null;
const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop: string | symbol) {
    if (!_prisma) {
      _prisma = new PrismaClient();
    }
    return (_prisma as any)[prop];
  },
});

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Request logger — helps find crashing routes in Vercel logs
app.use((req, _res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Helper to check if DB is connected
async function isDbConnected() {
  if (!process.env.DATABASE_URL) return false;
  try {
    await prisma.$connect();
    return true;
  } catch (e) {
    return false;
  }
}

// Admin IDs per platform
const ADMIN_IDS: Record<string, bigint> = {
  telegram: 1114947252n,
  // max: 123456789n, // TODO: установите ваш MAX admin ID
};

function isAdminId(platform: string, platformId: bigint): boolean {
  return ADMIN_IDS[platform] === platformId;
}

// Роли с доступом к админ-панели (admin — legacy alias for superadmin)
const ADMIN_ROLES = ['superadmin', 'support', 'restaurant', 'admin', 'courier'];
// Роли, которые могут менять роли других
const ROLE_MANAGER_ROLES = ['superadmin', 'support', 'admin'];
// Все допустимые роли
const ALL_ROLES = ['user', 'courier', 'restaurant', 'support', 'superadmin'];

// Password hashing helpers (built-in crypto, no extra deps)
function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, derived) => {
      if (err) return reject(err);
      resolve(salt + ':' + derived.toString('hex'));
    });
  });
}

function verifyPassword(password: string, hash: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const [salt, key] = hash.split(':');
    crypto.scrypt(password, salt, 64, (err, derived) => {
      if (err) return reject(err);
      resolve(derived.toString('hex') === key);
    });
  });
}

// Serialize user for JSON response (BigInt → string)
function serializeUser(user: any) {
  const { passwordHash, ...rest } = user;
  return {
    ...rest,
    platform: user.platform || 'telegram',
    platformId: (user.platformId ?? user.telegramId)?.toString(),
    telegramId: user.telegramId?.toString(),
  };
}

function normalizePromoCode(code: string) {
  return code.trim().toUpperCase();
}

function calculatePromoDiscount(promoCode: any, subtotal: number) {
  if (promoCode.discountType === 'percent') {
    return Math.min(subtotal, Math.round((subtotal * promoCode.value) / 100));
  }
  return Math.min(subtotal, promoCode.value);
}

async function validatePromoCode(code: string, subtotal: number) {
  const normalizedCode = normalizePromoCode(code);
  const promoCode = await prisma.promoCode.findUnique({ where: { code: normalizedCode } });
  if (!promoCode || !promoCode.isActive) {
    throw new Error('Промокод не найден или выключен');
  }
  if (promoCode.expiryDate && promoCode.expiryDate < new Date()) {
    throw new Error('Срок действия промокода истек');
  }
  if (subtotal < promoCode.minOrderAmount) {
    throw new Error(`Минимальная сумма заказа ${promoCode.minOrderAmount} ₽`);
  }

  const discount = calculatePromoDiscount(promoCode, subtotal);
  return { promoCode, discount, totalAfterDiscount: Math.max(0, subtotal - discount) };
}

// API Routes
app.get('/api/health', async (req, res) => {
  const dbStatus = await isDbConnected();
  res.json({ 
    status: 'ok', 
    database: dbStatus ? 'connected' : 'disconnected (using mock data)' 
  });
});

// Auth / User — unified endpoint for Telegram + MAX
app.post('/api/auth/platform', async (req, res) => {
  try {
    const { platform = 'telegram', id, first_name, last_name, username, photo_url } = req.body || {};

    if (!id) return res.status(400).json({ error: 'Missing user ID' });
    if (!['telegram', 'max'].includes(platform)) {
      return res.status(400).json({ error: 'Invalid platform. Use "telegram" or "max"' });
    }

    const platformId = BigInt(id);

    // Fallback: if no DATABASE_URL at all, return a mock user so the UI still works
    if (!process.env.DATABASE_URL) {
      return res.json({
        id: 'mock-' + id,
        platform,
        platformId: String(id),
        telegramId: platform === 'telegram' ? String(id) : null,
        firstName: first_name || 'Guest',
        lastName: last_name || null,
        username: username || null,
        photoUrl: photo_url || null,
        phone: null,
        role: isAdminId(platform, platformId) ? 'superadmin' : 'user',
        addresses: [],
        favorites: [],
      });
    }

    let user;
    try {
      user = await prisma.user.findUnique({
        where: { platform_platformId: { platform, platformId } },
      });
    } catch (dbErr: any) {
      console.error('DB connection/query failed:', dbErr);
      return res.status(500).json({
        error: 'Database error',
        message: dbErr?.message || String(dbErr),
      });
    }

    if (!user) {
      user = await prisma.user.create({
        data: {
          platform,
          platformId,
          telegramId: platform === 'telegram' ? platformId : null,
          firstName: first_name,
          lastName: last_name,
          username,
          photoUrl: photo_url,
          role: isAdminId(platform, platformId) ? 'superadmin' : 'user',
        },
      });
    } else {
      user = await prisma.user.update({
        where: { platform_platformId: { platform, platformId } },
        data: {
          firstName: first_name,
          lastName: last_name,
          username,
          photoUrl: photo_url,
          role: isAdminId(platform, platformId) ? 'superadmin' : user.role,
        },
      });
    }

    res.json(serializeUser(user));
  } catch (error: any) {
    console.error('Auth error:', error);
    res.status(500).json({
      error: 'Auth failed',
      message: error?.message || String(error),
    });
  }
});

// Legacy auth endpoint — redirects to unified
app.post('/api/auth/telegram', async (req, res) => {
  req.body.platform = 'telegram';
  res.redirect(307, '/api/auth/platform');
});

// Browser login by password
app.post('/api/auth/login', async (req, res) => {
  try {
    const { login, password } = req.body || {};
    if (!login || !password) {
      return res.status(400).json({ error: 'Введите логин и пароль' });
    }

    if (!process.env.DATABASE_URL) {
      return res.status(503).json({ error: 'База данных недоступна' });
    }

    const user = await prisma.user.findUnique({ where: { login } });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }

    res.json(serializeUser(user));
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Ошибка входа' });
  }
});

// Register new browser account (or set password for existing user)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { login, password, firstName, lastName } = req.body || {};
    if (!login || !password) {
      return res.status(400).json({ error: 'Введите логин и пароль' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Пароль минимум 6 символов' });
    }

    if (!process.env.DATABASE_URL) {
      return res.status(503).json({ error: 'База данных недоступна' });
    }

    const existing = await prisma.user.findUnique({ where: { login } });
    if (existing) {
      return res.status(409).json({ error: 'Этот логин уже занят' });
    }

    const pwHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        platform: 'browser',
        platformId: BigInt(Date.now()), // unique ID for browser users
        login,
        passwordHash: pwHash,
        firstName: firstName || login,
        lastName: lastName || null,
        role: 'user',
      },
    });

    res.json(serializeUser(user));
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Ошибка регистрации' });
  }
});

// Products
app.get('/api/products', async (req, res) => {
  try {
    if (!(await isDbConnected())) {
      return res.json([]);
    }
    const products = await prisma.product.findMany({
      where: { isAvailable: true },
      orderBy: { sortOrder: 'asc' },
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Categories
app.get('/api/categories', async (req, res) => {
  try {
    if (!(await isDbConnected())) {
      return res.json([]);
    }
    const categories = await prisma.category.findMany({
      where: { isVisible: true },
      orderBy: { sortOrder: 'asc' },
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Banners
app.get('/api/banners', async (req, res) => {
  try {
    if (!(await isDbConnected())) {
      return res.json([]);
    }
    const banners = await prisma.banner.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    res.json(banners);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch banners' });
  }
});

// Promo codes
app.post('/api/promo-codes/validate', async (req, res) => {
  const { code, subtotal } = req.body;
  const numericSubtotal = Number(subtotal);

  if (!code || !Number.isFinite(numericSubtotal) || numericSubtotal <= 0) {
    return res.status(400).json({ error: 'Введите промокод и сумму заказа' });
  }

  try {
    if (!(await isDbConnected())) {
      const normalizedCode = normalizePromoCode(code);
      if (normalizedCode !== 'ROSTOV20') {
        return res.status(404).json({ error: 'Промокод не найден или выключен' });
      }
      const discount = Math.min(numericSubtotal, Math.round(numericSubtotal * 0.2));
      return res.json({
        promoCode: {
          id: 'mock-promo-rostov20',
          code: normalizedCode,
          discountType: 'percent',
          value: 20,
          minOrderAmount: 0,
          isActive: true,
          expiryDate: null,
        },
        discount,
        totalAfterDiscount: Math.max(0, numericSubtotal - discount),
      });
    }

    const result = await validatePromoCode(code, numericSubtotal);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Промокод не применен' });
  }
});

// Orders
app.post('/api/orders', async (req, res) => {
  const { userId, items, totalAmount, deliveryFee, discount, promoCode, address, phone, name, deliveryType, paymentType, comment } = req.body;

  if (!userId || !items || !items.length || !address || !phone || !name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    if (!(await isDbConnected())) {
      return res.json({
        id: 'mock-order-' + Date.now(),
        userId,
        totalAmount,
        deliveryFee,
        discount: discount || 0,
        promoCode: promoCode ? normalizePromoCode(promoCode) : null,
        address,
        phone,
        name,
        deliveryType,
        paymentType,
        comment,
        status: 'created',
        createdAt: new Date().toISOString(),
        items: items.map((item: any) => ({
          ...item,
          id: 'mock-item-' + Math.random()
        }))
      });
    }

    // Verify user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(400).json({ error: 'Пользователь не найден. Перезайдите в приложение.' });
    }

    if (!user.phone && phone) {
      await prisma.user.update({
        where: { id: userId },
        data: { phone },
      });
    }

    // Check which products actually exist (productId is now optional on OrderItem)
    const productIds = items.map((item: any) => item.productId).filter(Boolean);
    const existingProducts = productIds.length > 0
      ? await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true } })
      : [];
    const existingProductIds = new Set(existingProducts.map(p => p.id));
    const subtotal = items.reduce((sum: number, item: any) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
    let appliedDiscount = 0;
    let appliedPromoCode: string | null = null;

    if (promoCode) {
      const validation = await validatePromoCode(promoCode, subtotal);
      appliedDiscount = validation.discount;
      appliedPromoCode = validation.promoCode.code;
    }

    const normalizedDeliveryFee = Number(deliveryFee || 0);
    const finalTotalAmount = Math.max(0, subtotal + normalizedDeliveryFee - appliedDiscount);

    const order = await prisma.order.create({
      data: {
        userId,
        totalAmount: finalTotalAmount,
        deliveryFee: normalizedDeliveryFee,
        discount: appliedDiscount,
        promoCode: appliedPromoCode,
        address,
        phone,
        name,
        deliveryType,
        paymentType,
        comment,
        status: 'created',
        items: {
          create: items.map((item: any) => ({
            // Only set productId if the product actually exists in DB, else null
            productId: item.productId && existingProductIds.has(item.productId) ? item.productId : null,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image || '',
          })),
        },
      },
      include: { items: true },
    });
    res.json(order);
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ error: 'Failed to create order. Please try again.' });
  }
});

app.get('/api/orders/user/:userId', async (req, res) => {
  try {
    if (!(await isDbConnected())) {
      return res.json([]);
    }
    const orders = await prisma.order.findMany({
      where: { userId: req.params.userId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Update Profile
app.patch('/api/user/profile', async (req, res) => {
  const { id, phone, addresses, favorites } = req.body;
  
  try {
    if (!(await isDbConnected())) {
      return res.json({
        id,
        phone,
        addresses,
        favorites,
        platform: 'telegram',
        platformId: '123456789',
        telegramId: '123456789',
        firstName: 'Mock',
        role: 'user'
      });
    }
    const user = await prisma.user.update({
      where: { id },
      data: {
        phone: phone !== undefined ? phone : undefined,
        addresses: addresses !== undefined ? addresses : undefined,
        favorites: favorites !== undefined ? favorites : undefined,
      },
    });

    res.json(serializeUser(user));
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Toggle Favorite
app.post('/api/user/favorites/toggle', async (req, res) => {
  const { userId, productId } = req.body;
  
  try {
    if (!(await isDbConnected())) {
      return res.json({
        id: userId,
        platform: 'telegram',
        platformId: '123456789',
        telegramId: '123456789',
        firstName: 'Mock',
        role: 'user',
        addresses: [],
        favorites: [productId],
      });
    }
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    let favorites = [...user.favorites];
    if (favorites.includes(productId)) {
      favorites = favorites.filter(id => id !== productId);
    } else {
      favorites.push(productId);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { favorites },
    });

    res.json(serializeUser(updatedUser));
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle favorite' });
  }
});

// Admin API
app.get('/api/admin/stats', async (req, res) => {
  try {
    if (!(await isDbConnected())) {
      return res.json({
        orderCount: 0,
        revenue: 0,
        userCount: 0,
        productCount: 0,
      });
    }
    const [orderCount, revenue, userCount, productCount] = await Promise.all([
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { totalAmount: true } }),
      prisma.user.count(),
      prisma.product.count(),
    ]);
    res.json({
      orderCount,
      revenue: revenue._sum.totalAmount || 0,
      userCount,
      productCount,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

app.get('/api/admin/orders', async (req, res) => {
  try {
    if (!(await isDbConnected())) {
      return res.json([]);
    }
    const orders = await prisma.order.findMany({
      include: { items: true, user: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    // Получаем имена курьеров
    const courierIds = [...new Set(orders.map(o => o.courierId).filter(Boolean))] as string[];
    const couriers = courierIds.length > 0
      ? await prisma.user.findMany({ where: { id: { in: courierIds } }, select: { id: true, firstName: true, lastName: true } })
      : [];
    const courierMap = Object.fromEntries(couriers.map(c => [c.id, `${c.firstName}${c.lastName ? ' ' + c.lastName : ''}`]));

    // Convert BigInt to string for JSON
    const sanitizedOrders = orders.map(o => ({
      ...o,
      user: serializeUser(o.user),
      courierName: o.courierId ? courierMap[o.courierId] || null : null,
    }));
    res.json(sanitizedOrders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.patch('/api/admin/orders/:id', async (req, res) => {
  const { status } = req.body;
  try {
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status },
      include: { items: true },
    });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// Назначить курьера на заказ
app.patch('/api/admin/orders/:id/courier', async (req, res) => {
  const { courierId } = req.body;
  try {
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { courierId: courierId || null },
      include: { items: true },
    });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to assign courier' });
  }
});

// Заказы конкретного курьера (только delivering + delivered)
app.get('/api/courier/orders/:courierId', async (req, res) => {
  try {
    if (!(await isDbConnected())) {
      return res.json([]);
    }
    const orders = await prisma.order.findMany({
      where: {
        courierId: req.params.courierId,
        status: { in: ['delivering', 'delivered'] },
      },
      include: { items: true, user: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    const sanitizedOrders = orders.map(o => ({
      ...o,
      user: serializeUser(o.user),
    }));
    res.json(sanitizedOrders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch courier orders' });
  }
});

app.get('/api/admin/users', async (req, res) => {
  try {
    if (!(await isDbConnected())) {
      return res.json([]);
    }
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
    const sanitizedUsers = users.map(u => serializeUser(u));
    res.json(sanitizedUsers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Change user role (only superadmin and support can do this)
app.patch('/api/admin/users/:id/role', async (req, res) => {
  try {
    const { role, requesterId } = req.body;
    if (!role || !requesterId) {
      return res.status(400).json({ error: 'Missing role or requesterId' });
    }
    if (!ALL_ROLES.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Check requester permissions
    const requester = await prisma.user.findUnique({ where: { id: requesterId } });
    if (!requester || !ROLE_MANAGER_ROLES.includes(requester.role)) {
      return res.status(403).json({ error: 'Недостаточно прав для смены ролей' });
    }

    // support can't assign superadmin role
    if (requester.role === 'support' && role === 'superadmin') {
      return res.status(403).json({ error: 'Тех. поддержка не может назначать главных админов' });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Can't change role of another superadmin (only superadmin themselves)
    const isSuperadmin = (r: string) => r === 'superadmin' || r === 'admin';
    if (isSuperadmin(targetUser.role) && !isSuperadmin(requester.role)) {
      return res.status(403).json({ error: 'Нельзя изменить роль главного администратора' });
    }

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
    });
    res.json(serializeUser(updated));
  } catch (error) {
    console.error('Role update error:', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

app.post('/api/admin/products', async (req, res) => {
  try {
    const product = await prisma.product.create({
      data: req.body,
    });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create product' });
  }
});

app.put('/api/admin/products/:id', async (req, res) => {
  try {
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

app.delete('/api/admin/products/:id', async (req, res) => {
  try {
    await prisma.product.delete({
      where: { id: req.params.id },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

app.post('/api/admin/categories', async (req, res) => {
  try {
    const category = await prisma.category.create({
      data: req.body,
    });
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create category' });
  }
});

app.put('/api/admin/categories/:id', async (req, res) => {
  try {
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update category' });
  }
});

app.delete('/api/admin/categories/:id', async (req, res) => {
  try {
    await prisma.category.delete({
      where: { id: req.params.id },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// Admin Banners
app.get('/api/admin/banners', async (req, res) => {
  try {
    if (!(await isDbConnected())) {
      return res.json([]);
    }
    const banners = await prisma.banner.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    res.json(banners);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch banners' });
  }
});

app.post('/api/admin/banners', async (req, res) => {
  try {
    const banner = await prisma.banner.create({
      data: req.body,
    });
    res.json(banner);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create banner' });
  }
});

app.put('/api/admin/banners/:id', async (req, res) => {
  try {
    const banner = await prisma.banner.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(banner);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update banner' });
  }
});

app.delete('/api/admin/banners/:id', async (req, res) => {
  try {
    await prisma.banner.delete({
      where: { id: req.params.id },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete banner' });
  }
});

// Admin Promo Codes
app.get('/api/admin/promo-codes', async (req, res) => {
  try {
    if (!(await isDbConnected())) {
      return res.json([]);
    }
    const promoCodes = await prisma.promoCode.findMany({
      orderBy: { code: 'asc' },
    });
    res.json(promoCodes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch promo codes' });
  }
});

app.post('/api/admin/promo-codes', async (req, res) => {
  try {
    const { code, discountType, value, minOrderAmount, isActive, expiryDate } = req.body;
    const promoCode = await prisma.promoCode.create({
      data: {
        code: normalizePromoCode(code),
        discountType,
        value: Number(value),
        minOrderAmount: Number(minOrderAmount || 0),
        isActive: Boolean(isActive),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
      },
    });
    res.json(promoCode);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create promo code' });
  }
});

app.put('/api/admin/promo-codes/:id', async (req, res) => {
  try {
    const { code, discountType, value, minOrderAmount, isActive, expiryDate } = req.body;
    const promoCode = await prisma.promoCode.update({
      where: { id: req.params.id },
      data: {
        ...(code !== undefined ? { code: normalizePromoCode(code) } : {}),
        ...(discountType !== undefined ? { discountType } : {}),
        ...(value !== undefined ? { value: Number(value) } : {}),
        ...(minOrderAmount !== undefined ? { minOrderAmount: Number(minOrderAmount || 0) } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
        ...(expiryDate !== undefined ? { expiryDate: expiryDate ? new Date(expiryDate) : null } : {}),
      },
    });
    res.json(promoCode);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update promo code' });
  }
});

app.delete('/api/admin/promo-codes/:id', async (req, res) => {
  try {
    await prisma.promoCode.delete({
      where: { id: req.params.id },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete promo code' });
  }
});

// =============================================
// YooKassa Payment Integration
// =============================================
const YOOKASSA_SHOP_ID = process.env.YOOKASSA_SHOP_ID || '';
const YOOKASSA_SECRET_KEY = process.env.YOOKASSA_SECRET_KEY || '';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

async function createYookassaPayment(amount: number, orderId: string, description: string) {
  const idempotenceKey = crypto.randomUUID();
  const auth = Buffer.from(`${YOOKASSA_SHOP_ID}:${YOOKASSA_SECRET_KEY}`).toString('base64');

  const response = await fetch('https://api.yookassa.ru/v3/payments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${auth}`,
      'Idempotence-Key': idempotenceKey,
    },
    body: JSON.stringify({
      amount: {
        value: amount.toFixed(2),
        currency: 'RUB',
      },
      capture: true,
      confirmation: {
        type: 'redirect',
        return_url: `${APP_URL}/payment/status?orderId=${orderId}`,
      },
      description,
      metadata: { orderId },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('YooKassa error:', errorText);
    throw new Error('Failed to create YooKassa payment');
  }

  return response.json();
}

// Create payment for an order
app.post('/api/payments/create', async (req, res) => {
  const { orderId } = req.body;
  if (!orderId) return res.status(400).json({ error: 'Missing orderId' });

  try {
    if (!YOOKASSA_SHOP_ID || !YOOKASSA_SECRET_KEY) {
      return res.status(503).json({ error: 'Оплата онлайн временно недоступна. Платёжная система не настроена.' });
    }

    if (!(await isDbConnected())) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.paymentStatus === 'succeeded') return res.status(400).json({ error: 'Order already paid' });

    const description = `Заказ #${order.id.slice(0, 8)} — ${order.items.length} товар(ов)`;
    const payment = await createYookassaPayment(order.totalAmount, order.id, description);

    // Save payment info to order
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentId: payment.id,
        paymentStatus: payment.status,
        paymentUrl: payment.confirmation?.confirmation_url || null,
      },
    });

    res.json({
      paymentId: payment.id,
      paymentUrl: payment.confirmation?.confirmation_url,
      status: payment.status,
    });
  } catch (error) {
    console.error('Payment creation error:', error);
    res.status(500).json({ error: 'Не удалось создать платёж' });
  }
});

// YooKassa webhook — called by YooKassa when payment status changes
app.post('/api/payments/webhook', async (req, res) => {
  try {
    const event = req.body;

    if (event.event === 'payment.succeeded') {
      const paymentId = event.object?.id;
      const orderId = event.object?.metadata?.orderId;

      if (orderId) {
        await prisma.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: 'succeeded',
            status: 'confirmed',
          },
        });
      }
    }

    if (event.event === 'payment.canceled') {
      const orderId = event.object?.metadata?.orderId;
      if (orderId) {
        await prisma.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: 'canceled',
            status: 'cancelled',
          },
        });
      }
    }

    res.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Check payment status (polling from frontend after redirect back)
app.get('/api/payments/status/:orderId', async (req, res) => {
  try {
    if (!(await isDbConnected())) {
      return res.json({ paymentStatus: 'unknown' });
    }
    const order = await prisma.order.findUnique({
      where: { id: req.params.orderId },
      select: { paymentStatus: true, paymentId: true, status: true },
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // If pending, check YooKassa directly for latest status
    if (order.paymentId && order.paymentStatus === 'pending' && YOOKASSA_SHOP_ID && YOOKASSA_SECRET_KEY) {
      const auth = Buffer.from(`${YOOKASSA_SHOP_ID}:${YOOKASSA_SECRET_KEY}`).toString('base64');
      const ykRes = await fetch(`https://api.yookassa.ru/v3/payments/${order.paymentId}`, {
        headers: { 'Authorization': `Basic ${auth}` },
      });
      if (ykRes.ok) {
        const payment = await ykRes.json() as any;
        if (payment.status !== order.paymentStatus) {
          const newStatus = payment.status === 'succeeded' ? 'confirmed' : payment.status === 'canceled' ? 'cancelled' : undefined;
          await prisma.order.update({
            where: { id: req.params.orderId },
            data: {
              paymentStatus: payment.status,
              ...(newStatus ? { status: newStatus } : {}),
            },
          });
          return res.json({ paymentStatus: payment.status, orderStatus: newStatus || order.status });
        }
      }
    }

    res.json({ paymentStatus: order.paymentStatus, orderStatus: order.status });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check payment status' });
  }
});

// =============================================
// Yandex Delivery (Яндекс Доставка) — real courier service
// API docs: https://yandex.ru/dev/logistics/api/
// =============================================
const YANDEX_DELIVERY_TOKEN = process.env.YANDEX_DELIVERY_TOKEN || '';
const YANDEX_DELIVERY_BASE = 'https://b2b.taxi.yandex.net';

// Restaurant pickup point (configured via env)
const RESTAURANT_ADDRESS = process.env.RESTAURANT_ADDRESS || 'Ростов-на-Дону, ул. Большая Садовая, 1';
const RESTAURANT_LAT = parseFloat(process.env.RESTAURANT_LAT || '47.2357');
const RESTAURANT_LNG = parseFloat(process.env.RESTAURANT_LNG || '39.7015');
const RESTAURANT_PHONE = process.env.RESTAURANT_PHONE || '+79001234567';
const RESTAURANT_NAME = process.env.RESTAURANT_NAME || 'Ресторан';

// Yandex Geocoder for resolving customer addresses to coordinates
const YANDEX_GEOCODER_KEY = process.env.YANDEX_GEOCODER_API_KEY || '';

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number; fullAddress: string } | null> {
  if (!YANDEX_GEOCODER_KEY) return null;

  const query = encodeURIComponent(`Ростов-на-Дону, ${address}`);
  const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${YANDEX_GEOCODER_KEY}&geocode=${query}&format=json&results=1`;

  const response = await fetch(url);
  if (!response.ok) return null;

  const data = await response.json() as any;
  const geoObject = data?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject;
  if (!geoObject) return null;

  const point = geoObject.Point?.pos;
  if (!point) return null;

  const [lng, lat] = point.split(' ').map(Number);
  const fullAddress = geoObject.metaDataProperty?.GeocoderMetaData?.text || address;
  return { lat, lng, fullAddress };
}

// Check delivery price via Yandex Delivery API (check-price)
app.post('/api/delivery/calculate', async (req, res) => {
  const { address } = req.body;
  if (!address) return res.status(400).json({ error: 'Address is required' });

  try {
    // Step 1: Geocode customer address
    const customerCoords = await geocodeAddress(address);

    if (!YANDEX_DELIVERY_TOKEN) {
      // Fallback when Yandex Delivery not configured — use flat rate
      return res.json({
        available: true,
        fee: 150,
        estimatedMinutes: null,
        message: 'Доставка: 150₽ (Яндекс Доставка не настроена)',
        yandexAvailable: false,
      });
    }

    // Step 2: Call Yandex Delivery check-price
    const dropoffLat = customerCoords?.lat || RESTAURANT_LAT;
    const dropoffLng = customerCoords?.lng || RESTAURANT_LNG;

    const checkPriceBody = {
      items: [
        {
          quantity: 1,
          size: { height: 0.3, length: 0.3, width: 0.3 },
          weight: 3,
        },
      ],
      route_points: [
        {
          coordinates: [RESTAURANT_LNG, RESTAURANT_LAT],
          fullname: RESTAURANT_ADDRESS,
        },
        {
          coordinates: [dropoffLng, dropoffLat],
          fullname: customerCoords?.fullAddress || `Ростов-на-Дону, ${address}`,
        },
      ],
      skip_door_to_door: false,
    };

    const ydResponse = await fetch(`${YANDEX_DELIVERY_BASE}/b2b/cargo/integration/v2/check-price`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${YANDEX_DELIVERY_TOKEN}`,
        'Accept-Language': 'ru',
      },
      body: JSON.stringify(checkPriceBody),
    });

    if (!ydResponse.ok) {
      const errText = await ydResponse.text();
      console.error('Yandex Delivery check-price error:', ydResponse.status, errText);
      // Fallback on error
      return res.json({
        available: true,
        fee: 150,
        estimatedMinutes: null,
        message: 'Доставка: 150₽ (не удалось рассчитать через Яндекс)',
        yandexAvailable: false,
      });
    }

    const priceData = await ydResponse.json() as any;

    // Find the best tariff (express or courier)
    // priceData contains array of offers or a single price depending on API version
    let fee = 0;
    let estimatedMinutes: number | null = null;
    let tariffName = '';

    if (priceData.price) {
      // Direct price response
      fee = Math.ceil(parseFloat(priceData.price));
      tariffName = priceData.tariff || 'express';
    } else if (Array.isArray(priceData)) {
      // Multiple tariff options
      const expressTariff = priceData.find((t: any) => t.taxi_class === 'express' || t.taxi_class === 'courier');
      const bestTariff = expressTariff || priceData[0];
      if (bestTariff) {
        fee = Math.ceil(parseFloat(bestTariff.price || bestTariff.final_price || '0'));
        tariffName = bestTariff.taxi_class || 'express';
        estimatedMinutes = bestTariff.estimated_time_of_arrival || null;
      }
    }

    if (fee <= 0) {
      return res.json({
        available: false,
        fee: 0,
        estimatedMinutes: null,
        message: 'Яндекс Доставка недоступна для этого адреса',
        yandexAvailable: false,
      });
    }

    res.json({
      available: true,
      fee,
      estimatedMinutes,
      tariff: tariffName,
      message: `Яндекс Доставка: ${fee}₽` + (estimatedMinutes ? ` (~${estimatedMinutes} мин)` : ''),
      yandexAvailable: true,
    });
  } catch (error) {
    console.error('Delivery calculation error:', error);
    res.json({
      available: true,
      fee: 150,
      estimatedMinutes: null,
      message: 'Доставка: 150₽',
      yandexAvailable: false,
    });
  }
});

// Create actual Yandex Delivery claim (called after order is confirmed)
app.post('/api/delivery/create-claim', async (req, res) => {
  const { orderId } = req.body;
  if (!orderId) return res.status(400).json({ error: 'Missing orderId' });

  try {
    if (!YANDEX_DELIVERY_TOKEN) {
      return res.status(503).json({ error: 'Яндекс Доставка не настроена' });
    }

    if (!(await isDbConnected())) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, user: true },
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.deliveryType !== 'delivery') return res.status(400).json({ error: 'Order is pickup, not delivery' });

    // Geocode delivery address
    const customerCoords = await geocodeAddress(order.address);
    const dropoffLat = customerCoords?.lat || RESTAURANT_LAT;
    const dropoffLng = customerCoords?.lng || RESTAURANT_LNG;

    const claimBody = {
      emergency_contact: { name: RESTAURANT_NAME, phone: RESTAURANT_PHONE },
      items: order.items.map(item => ({
        title: item.name,
        quantity: item.quantity,
        size: { height: 0.15, length: 0.15, width: 0.15 },
        weight: 0.5,
        cost_value: String(item.price),
        cost_currency: 'RUB',
      })),
      route_points: [
        {
          coordinates: [RESTAURANT_LNG, RESTAURANT_LAT],
          fullname: RESTAURANT_ADDRESS,
          type: 'source',
          contact: { name: RESTAURANT_NAME, phone: RESTAURANT_PHONE },
          visit_order: 1,
        },
        {
          coordinates: [dropoffLng, dropoffLat],
          fullname: customerCoords?.fullAddress || order.address,
          type: 'destination',
          contact: {
            name: order.name,
            phone: order.phone,
          },
          visit_order: 2,
        },
      ],
      skip_door_to_door: false,
      comment: order.comment || '',
      client_requirements: { taxi_class: 'express' },
    };

    const claimResponse = await fetch(
      `${YANDEX_DELIVERY_BASE}/b2b/cargo/integration/v2/claims/create?request_id=${crypto.randomUUID()}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${YANDEX_DELIVERY_TOKEN}`,
          'Accept-Language': 'ru',
        },
        body: JSON.stringify(claimBody),
      }
    );

    if (!claimResponse.ok) {
      const errText = await claimResponse.text();
      console.error('Yandex Delivery claim error:', claimResponse.status, errText);
      return res.status(500).json({ error: 'Не удалось создать заявку на доставку' });
    }

    const claim = await claimResponse.json() as any;

    // Save claim ID to order
    await prisma.order.update({
      where: { id: orderId },
      data: {
        deliveryClaimId: claim.id,
        deliveryStatus: claim.status,
      },
    });

    res.json({
      claimId: claim.id,
      status: claim.status,
      version: claim.version,
    });
  } catch (error) {
    console.error('Delivery claim creation error:', error);
    res.status(500).json({ error: 'Failed to create delivery claim' });
  }
});

// Check Yandex Delivery claim status
app.get('/api/delivery/status/:orderId', async (req, res) => {
  try {
    if (!(await isDbConnected())) {
      return res.json({ status: 'unknown' });
    }

    const order = await prisma.order.findUnique({
      where: { id: req.params.orderId },
      select: { deliveryClaimId: true, deliveryStatus: true },
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (!order.deliveryClaimId) return res.json({ status: 'no_claim' });

    if (!YANDEX_DELIVERY_TOKEN) {
      return res.json({ status: order.deliveryStatus || 'unknown' });
    }

    // Fetch latest status from Yandex
    const infoResponse = await fetch(
      `${YANDEX_DELIVERY_BASE}/b2b/cargo/integration/v2/claims/info?claim_id=${order.deliveryClaimId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${YANDEX_DELIVERY_TOKEN}`,
          'Accept-Language': 'ru',
        },
        body: '{}',
      }
    );

    if (!infoResponse.ok) {
      return res.json({ status: order.deliveryStatus || 'unknown' });
    }

    const info = await infoResponse.json() as any;

    // Update stored status if changed
    if (info.status !== order.deliveryStatus) {
      await prisma.order.update({
        where: { id: req.params.orderId },
        data: { deliveryStatus: info.status },
      });
    }

    res.json({
      status: info.status,
      courierName: info.performer_info?.courier_name || null,
      courierPhone: info.performer_info?.legal_phone || null,
      eta: info.eta || null,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check delivery status' });
  }
});

// Cancel Yandex Delivery claim
app.post('/api/delivery/cancel', async (req, res) => {
  const { orderId } = req.body;
  try {
    if (!YANDEX_DELIVERY_TOKEN || !(await isDbConnected())) {
      return res.status(503).json({ error: 'Service unavailable' });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { deliveryClaimId: true },
    });
    if (!order?.deliveryClaimId) return res.status(400).json({ error: 'No delivery claim' });

    // First get current version
    const infoRes = await fetch(
      `${YANDEX_DELIVERY_BASE}/b2b/cargo/integration/v2/claims/info?claim_id=${order.deliveryClaimId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${YANDEX_DELIVERY_TOKEN}`,
          'Accept-Language': 'ru',
        },
        body: '{}',
      }
    );
    const info = await infoRes.json() as any;

    const cancelRes = await fetch(
      `${YANDEX_DELIVERY_BASE}/b2b/cargo/integration/v2/claims/cancel?claim_id=${order.deliveryClaimId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${YANDEX_DELIVERY_TOKEN}`,
          'Accept-Language': 'ru',
        },
        body: JSON.stringify({
          cancel_state: 'free',
          version: info.version || 1,
        }),
      }
    );

    if (!cancelRes.ok) {
      const errText = await cancelRes.text();
      console.error('Cancel delivery error:', errText);
      return res.status(500).json({ error: 'Не удалось отменить доставку' });
    }

    const cancelData = await cancelRes.json() as any;
    await prisma.order.update({
      where: { id: orderId },
      data: { deliveryStatus: cancelData.status || 'cancelled' },
    });

    res.json({ status: cancelData.status });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel delivery' });
  }
});

// Seed API (Dev only)
app.post('/api/dev/seed', async (req, res) => {
  try {
    if (!(await isDbConnected())) {
      return res.status(400).json({
        error: 'Database not connected. Please add DATABASE_URL to your secrets to seed the real database.'
      });
    }
    // Clear existing data (preserve users to avoid breaking auth/orders)
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.banner.deleteMany();
    await prisma.promoCode.deleteMany();

    // Seed Categories
    const categories = [
      { name: 'Комбо', slug: 'combo', sortOrder: 1, image: 'https://cdn-icons-png.flaticon.com/512/2713/2713931.png' },
      { name: 'Завтраки', slug: 'breakfast', sortOrder: 2, image: 'https://cdn-icons-png.flaticon.com/512/887/887359.png' },
      { name: 'Салаты', slug: 'salads', sortOrder: 3, image: 'https://cdn-icons-png.flaticon.com/512/3768/3768493.png' },
      { name: 'Первые блюда', slug: 'soups', sortOrder: 4, image: 'https://cdn-icons-png.flaticon.com/512/3480/3480473.png' },
      { name: 'Вторые блюда', slug: 'main-dishes', sortOrder: 5, image: 'https://cdn-icons-png.flaticon.com/512/3480/3480488.png' },
      { name: 'Гарниры', slug: 'side-dishes', sortOrder: 6, image: 'https://cdn-icons-png.flaticon.com/512/2362/2362361.png' },
      { name: 'Закуски', slug: 'snacks', sortOrder: 7, image: 'https://cdn-icons-png.flaticon.com/512/2515/2515183.png' },
      { name: 'Десерты и выпечка', slug: 'desserts', sortOrder: 8, image: 'https://cdn-icons-png.flaticon.com/512/992/992717.png' },
      { name: 'Напитки', slug: 'drinks', sortOrder: 9, image: 'https://cdn-icons-png.flaticon.com/512/2405/2405479.png' },
      { name: 'Вся готовая еда', slug: 'all-ready-food', sortOrder: 10, image: 'https://cdn-icons-png.flaticon.com/512/3480/3480488.png' },
    ];

    for (const cat of categories) {
      await prisma.category.create({ data: cat });
    }

    const createdCategories = await prisma.category.findMany();
    const mainDishesCat = createdCategories.find(c => c.slug === 'main-dishes');
    const soupsCat = createdCategories.find(c => c.slug === 'soups');
    const saladsCat = createdCategories.find(c => c.slug === 'salads');
    const drinksCat = createdCategories.find(c => c.slug === 'drinks');

    // Seed Products
    const products = [
      {
        name: 'Котлета по-киевски с пюре',
        slug: 'kiev-cutlet',
        description: 'Классическая котлета по-киевски с нежным картофельным пюре.',
        price: 450,
        oldPrice: 550,
        categoryId: mainDishesCat!.id,
        images: ['https://picsum.photos/seed/main1/800/800'],
        weight: '350г',
        kcal: 850,
        proteins: 35,
        fats: 45,
        carbs: 65,
        tags: ['мясо', 'сытно'],
        isPopular: true,
        isNew: false,
        isAvailable: true,
        sortOrder: 1
      },
      {
        name: 'Борщ с говядиной',
        slug: 'borscht',
        description: 'Наваристый борщ со сметаной и зеленью.',
        price: 320,
        categoryId: soupsCat!.id,
        images: ['https://picsum.photos/seed/soup1/800/800'],
        weight: '300г',
        kcal: 420,
        proteins: 18,
        fats: 25,
        carbs: 35,
        tags: ['суп', 'хит'],
        isPopular: true,
        isNew: false,
        isAvailable: true,
        sortOrder: 1
      },
      {
        name: 'Салат Цезарь с курицей',
        slug: 'caesar-chicken',
        description: 'Свежие листья салата, куриное филе, пармезан, сухарики и фирменный соус.',
        price: 390,
        categoryId: saladsCat!.id,
        images: ['https://picsum.photos/seed/salad1/800/800'],
        weight: '250г',
        kcal: 350,
        proteins: 25,
        fats: 20,
        carbs: 15,
        tags: ['салат', 'легкое'],
        isPopular: true,
        isNew: false,
        isAvailable: true,
        sortOrder: 1
      },
      {
        name: 'Морс Домашний',
        slug: 'mors',
        description: 'Освежающий морс из донских ягод.',
        price: 150,
        categoryId: drinksCat!.id,
        images: ['https://picsum.photos/seed/drink1/800/800'],
        weight: '500мл',
        kcal: 120,
        proteins: 0,
        fats: 0,
        carbs: 30,
        tags: ['натуральное'],
        isPopular: false,
        isNew: false,
        isAvailable: true,
        sortOrder: 1
      }
    ];

    for (const prod of products) {
      await prisma.product.create({ data: prod });
    }

    // Seed Banners
    const banners = [
      {
        title: 'Скидка 20% на первый заказ',
        subtitle: 'Используйте промокод ROSTOV20',
        image: 'https://picsum.photos/seed/banner1/1200/600',
        isActive: true,
        sortOrder: 1
      },
      {
        title: 'Бесплатная доставка от 1500₽',
        subtitle: 'По всему Ростову-на-Дону',
        image: 'https://picsum.photos/seed/banner2/1200/600',
        isActive: true,
        sortOrder: 2
      }
    ];

    for (const banner of banners) {
      await prisma.banner.create({ data: banner });
    }

    await prisma.promoCode.create({
      data: {
        code: 'ROSTOV20',
        discountType: 'percent',
        value: 20,
        minOrderAmount: 0,
        isActive: true,
      },
    });

    res.json({ message: 'Database seeded successfully' });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ error: 'Failed to seed database' });
  }
});

async function startServer() {
  // On Vercel, static files are served separately via vercel.json rewrites —
  // the serverless function only handles /api/* routes. Skip entirely.
  if (process.env.VERCEL) return;

  // Local dev / production: serve the Vite app
  if (process.env.NODE_ENV !== 'production') {
    // Hide import from bundlers (Vercel/esbuild) so Vite isn't bundled into the serverless function
    const viteModuleName = 'vite';
    const viteMod: any = await import(/* @vite-ignore */ viteModuleName);
    const vite = await viteMod.createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const port = process.env.PORT || 3000;
  app.listen(port as number, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

// Global error handler — MUST be last. Returns JSON error instead of
// letting the Vercel function crash with FUNCTION_INVOCATION_FAILED.
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('EXPRESS ERROR HANDLER:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err?.message || String(err),
    stack: process.env.NODE_ENV !== 'production' ? err?.stack : undefined,
  });
});

// Only start the local/HTTP server when NOT on Vercel.
// On Vercel, api/index.ts imports `app` directly and Vercel handles the HTTP layer.
if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error('Server startup error:', err);
  });
}

export default app;
