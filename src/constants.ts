export const ROSTOV_COORDINATES = {
  lat: 47.2357,
  lng: 39.7015,
};

export const DELIVERY_FEE = 150;
export const FREE_DELIVERY_THRESHOLD = 1500;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  created: 'Заказ создан',
  confirmed: 'Подтвержден',
  preparing: 'Готовится',
  delivering: 'В пути',
  delivered: 'Доставлен',
  cancelled: 'Отменен',
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  created: 'bg-blue-500',
  confirmed: 'bg-indigo-500',
  preparing: 'bg-amber-500',
  delivering: 'bg-purple-500',
  delivered: 'bg-green-500',
  cancelled: 'bg-red-500',
};

export const PAYMENT_TYPE_LABELS: Record<string, string> = {
  cash: 'Наличные',
  card: 'Картой курьеру',
  online: 'Онлайн (ЮKassa)',
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'Ожидает оплаты',
  succeeded: 'Оплачено',
  canceled: 'Отменено',
  waiting_for_capture: 'Обрабатывается',
};
