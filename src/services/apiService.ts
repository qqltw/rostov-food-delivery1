import { Product, Category, Banner, Order, User, DeliveryEstimate, PaymentResult } from '../types';

const API_BASE = '/api';

export const apiService = {
  // Products
  async getProducts(): Promise<Product[]> {
    const res = await fetch(`${API_BASE}/products`);
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    const res = await fetch(`${API_BASE}/categories`);
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
  },

  // Banners
  async getBanners(): Promise<Banner[]> {
    const res = await fetch(`${API_BASE}/banners`);
    if (!res.ok) throw new Error('Failed to fetch banners');
    return res.json();
  },

  // Orders
  async createOrder(orderData: any): Promise<Order> {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });
    if (!res.ok) throw new Error('Failed to create order');
    return res.json();
  },

  async getUserOrders(userId: string): Promise<Order[]> {
    const res = await fetch(`${API_BASE}/orders/user/${userId}`);
    if (!res.ok) throw new Error('Failed to fetch orders');
    return res.json();
  },

  async updateProfile(userId: string, data: { phone?: string; addresses?: any[]; favorites?: string[] }): Promise<User> {
    const res = await fetch(`${API_BASE}/user/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: userId, ...data }),
    });
    if (!res.ok) throw new Error('Failed to update profile');
    return res.json();
  },

  async toggleFavorite(userId: string, productId: string): Promise<User> {
    const res = await fetch(`${API_BASE}/user/favorites/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, productId }),
    });
    if (!res.ok) throw new Error('Failed to toggle favorite');
    return res.json();
  },

  // Auth (unified for Telegram + MAX)
  async loginPlatform(data: { platform: string; id: number; first_name: string; last_name?: string; username?: string; photo_url?: string }): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/platform`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Auth failed (${res.status}): ${errText.slice(0, 200)}`);
    }
    return res.json();
  },

  // Login by password (browser mode)
  async loginPassword(login: string, password: string): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(errText || 'Неверный логин или пароль');
    }
    return res.json();
  },

  // Legacy: keep for backward compat
  async loginTelegram(tgData: any): Promise<User> {
    return this.loginPlatform({ platform: 'telegram', ...tgData });
  },

  // Admin
  async getAdminStats(): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/stats`);
    if (!res.ok) throw new Error('Failed to fetch admin stats');
    return res.json();
  },

  async getAdminOrders(): Promise<Order[]> {
    const res = await fetch(`${API_BASE}/admin/orders`);
    if (!res.ok) throw new Error('Failed to fetch admin orders');
    return res.json();
  },

  async updateOrderStatus(orderId: string, status: string): Promise<Order> {
    const res = await fetch(`${API_BASE}/admin/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update order status');
    return res.json();
  },

  async assignCourier(orderId: string, courierId: string | null): Promise<Order> {
    const res = await fetch(`${API_BASE}/admin/orders/${orderId}/courier`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courierId }),
    });
    if (!res.ok) throw new Error('Failed to assign courier');
    return res.json();
  },

  async getCourierOrders(courierId: string): Promise<Order[]> {
    const res = await fetch(`${API_BASE}/courier/orders/${courierId}`);
    if (!res.ok) throw new Error('Failed to fetch courier orders');
    return res.json();
  },

  async getAdminUsers(): Promise<User[]> {
    const res = await fetch(`${API_BASE}/admin/users`);
    if (!res.ok) throw new Error('Failed to fetch admin users');
    return res.json();
  },

  async updateUserRole(userId: string, role: string, requesterId: string): Promise<User> {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, requesterId }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: 'Failed to update role' }));
      throw new Error(data.error || 'Failed to update role');
    }
    return res.json();
  },

  async createProduct(productData: any): Promise<Product> {
    const res = await fetch(`${API_BASE}/admin/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData),
    });
    if (!res.ok) throw new Error('Failed to create product');
    return res.json();
  },

  async updateProduct(id: string, productData: any): Promise<Product> {
    const res = await fetch(`${API_BASE}/admin/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData),
    });
    if (!res.ok) throw new Error('Failed to update product');
    return res.json();
  },

  async deleteProduct(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/admin/products/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete product');
  },

  async createCategory(categoryData: any): Promise<Category> {
    const res = await fetch(`${API_BASE}/admin/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(categoryData),
    });
    if (!res.ok) throw new Error('Failed to create category');
    return res.json();
  },

  async updateCategory(id: string, categoryData: any): Promise<Category> {
    const res = await fetch(`${API_BASE}/admin/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(categoryData),
    });
    if (!res.ok) throw new Error('Failed to update category');
    return res.json();
  },

  async deleteCategory(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/admin/categories/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete category');
  },

  // Admin Banners
  async getAdminBanners(): Promise<Banner[]> {
    const res = await fetch(`${API_BASE}/admin/banners`);
    if (!res.ok) throw new Error('Failed to fetch admin banners');
    return res.json();
  },

  async createBanner(bannerData: any): Promise<Banner> {
    const res = await fetch(`${API_BASE}/admin/banners`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bannerData),
    });
    if (!res.ok) throw new Error('Failed to create banner');
    return res.json();
  },

  async updateBanner(id: string, bannerData: any): Promise<Banner> {
    const res = await fetch(`${API_BASE}/admin/banners/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bannerData),
    });
    if (!res.ok) throw new Error('Failed to update banner');
    return res.json();
  },

  async deleteBanner(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/admin/banners/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete banner');
  },

  // Payments (YooKassa)
  async createPayment(orderId: string): Promise<PaymentResult> {
    const res = await fetch(`${API_BASE}/payments/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Payment failed' }));
      throw new Error(err.error || 'Failed to create payment');
    }
    return res.json();
  },

  async getPaymentStatus(orderId: string): Promise<{ paymentStatus: string; orderStatus: string }> {
    const res = await fetch(`${API_BASE}/payments/status/${orderId}`);
    if (!res.ok) throw new Error('Failed to check payment status');
    return res.json();
  },

  // Delivery (Yandex Delivery)
  async calculateDelivery(address: string): Promise<DeliveryEstimate> {
    const res = await fetch(`${API_BASE}/delivery/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address }),
    });
    if (!res.ok) throw new Error('Failed to calculate delivery');
    return res.json();
  },

  async createDeliveryClaim(orderId: string): Promise<{ claimId: string; status: string }> {
    const res = await fetch(`${API_BASE}/delivery/create-claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
    });
    if (!res.ok) throw new Error('Failed to create delivery claim');
    return res.json();
  },

  async getDeliveryStatus(orderId: string): Promise<{ status: string; courierName?: string; courierPhone?: string; eta?: string }> {
    const res = await fetch(`${API_BASE}/delivery/status/${orderId}`);
    if (!res.ok) throw new Error('Failed to check delivery status');
    return res.json();
  },

  async cancelDelivery(orderId: string): Promise<{ status: string }> {
    const res = await fetch(`${API_BASE}/delivery/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
    });
    if (!res.ok) throw new Error('Failed to cancel delivery');
    return res.json();
  },

  // Seed
  async seedDatabase(): Promise<any> {
    const res = await fetch(`${API_BASE}/dev/seed`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to seed database');
    return res.json();
  },

  async getHealth(): Promise<{ status: string; database: string }> {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Health check failed');
    return res.json();
  }
};
