export interface Address {
  street: string;
  house: string;
  privateHouse?: boolean;
  entrance?: string;
  floor?: string;
  intercom?: string;
  comment?: string;
  leaveAtDoor: boolean;
}

export type Platform = 'telegram' | 'max' | 'browser';

export type UserRole = 'user' | 'courier' | 'restaurant' | 'support' | 'superadmin' | 'admin';

// Роли с доступом к админ-панели (admin — legacy, = superadmin)
export const ADMIN_ROLES: UserRole[] = ['superadmin', 'support', 'restaurant', 'admin', 'courier'];

// Роли, которые могут управлять ролями других пользователей
export const ROLE_MANAGER_ROLES: UserRole[] = ['superadmin', 'support', 'admin'];

export const ROLE_LABELS: Record<string, string> = {
  user: 'Клиент',
  courier: 'Курьер',
  restaurant: 'Ресторан',
  support: 'Тех. поддержка',
  superadmin: 'Главный админ',
  admin: 'Главный админ',
};

export interface User {
  id: string;
  platform: Platform;
  platformId: string;
  telegramId?: string;
  firstName: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
  phone?: string;
  addresses: Address[];
  favorites: string[];
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  sortOrder: number;
  isVisible: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  oldPrice?: number;
  categoryId: string;
  images: string[];
  weight: string;
  kcal: number;
  proteins: number;
  fats: number;
  carbs: number;
  tags: string[];
  isPopular: boolean;
  isNew: boolean;
  isAvailable: boolean;
  sortOrder: number;
}

export type OrderStatus = 'created' | 'confirmed' | 'preparing' | 'delivering' | 'delivered' | 'cancelled';

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Order {
  id: string;
  userId: string;
  courierId?: string | null;
  courierName?: string;
  items: OrderItem[];
  totalAmount: number;
  deliveryFee: number;
  discount: number;
  promoCode?: string;
  status: OrderStatus;
  address: string;
  phone: string;
  name: string;
  comment?: string;
  deliveryType: 'delivery' | 'pickup';
  paymentType: 'cash' | 'card' | 'online';
  paymentId?: string;
  paymentStatus?: string;
  paymentUrl?: string;
  deliveryClaimId?: string;
  deliveryStatus?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryEstimate {
  available: boolean;
  fee: number;
  estimatedMinutes?: number | null;
  tariff?: string;
  message: string;
  yandexAvailable?: boolean;
}

export interface PaymentResult {
  paymentId: string;
  paymentUrl: string;
  status: string;
}

export interface PromoCode {
  code: string;
  discountType: 'percent' | 'fixed';
  value: number;
  minOrderAmount: number;
  isActive: boolean;
  expiryDate: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  link?: string;
  isActive: boolean;
  sortOrder: number;
}
