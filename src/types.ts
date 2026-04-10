export interface Address {
  street: string;
  house: string;
  entrance?: string;
  comment?: string;
  leaveAtDoor: boolean;
}

export interface User {
  id: string;
  telegramId: string;
  firstName: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
  phone?: string;
  addresses: Address[];
  favorites: string[];
  role: 'user' | 'admin';
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
