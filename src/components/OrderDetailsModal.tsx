import React from 'react';
import { Modal } from './Modal';
import { Order } from '../types';
import { formatPrice, cn } from '../lib/utils';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../constants';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  MapPin, Phone, User as UserIcon, Truck, Store, CreditCard, Banknote,
  Wallet, MessageSquare, Calendar, Package, CheckCircle2, XCircle, Clock, Copy
} from 'lucide-react';

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

const paymentLabels: Record<string, { label: string; icon: any }> = {
  cash: { label: 'Наличные курьеру', icon: Banknote },
  card: { label: 'Картой курьеру', icon: Wallet },
  online: { label: 'Онлайн (ЮKassa)', icon: CreditCard },
};

const paymentStatusLabels: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Ожидает оплаты', color: 'text-yellow-500', icon: Clock },
  waiting_for_capture: { label: 'Ожидает подтверждения', color: 'text-yellow-500', icon: Clock },
  succeeded: { label: 'Оплачено', color: 'text-green-500', icon: CheckCircle2 },
  canceled: { label: 'Отменено', color: 'text-red-500', icon: XCircle },
};

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ isOpen, onClose, order }) => {
  if (!order) return null;

  const payment = paymentLabels[order.paymentType] || { label: order.paymentType, icon: CreditCard };
  const PaymentIcon = payment.icon;

  const payStatus = order.paymentStatus ? paymentStatusLabels[order.paymentStatus] : null;
  const PayStatusIcon = payStatus?.icon;

  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
  };

  const subtotal = order.totalAmount - (order.deliveryFee || 0) + (order.discount || 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Заказ #${order.id.slice(-6)}`}>
      <div className="flex flex-col gap-5">
        {/* Status + date */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Calendar size={14} />
            {format(new Date(order.createdAt), 'd MMMM yyyy, HH:mm', { locale: ru })}
          </div>
          <div className={cn(
            'px-3 py-1 rounded-full text-[10px] font-black uppercase text-white',
            ORDER_STATUS_COLORS[order.status]
          )}>
            {ORDER_STATUS_LABELS[order.status]}
          </div>
        </div>

        {/* Customer */}
        <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-4 flex flex-col gap-2">
          <div className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Клиент</div>
          <div className="flex items-center gap-2 text-sm text-zinc-900 dark:text-zinc-100">
            <UserIcon size={16} className="text-zinc-400" />
            <span className="font-bold">{order.name}</span>
          </div>
          <button
            onClick={() => copyToClipboard(order.phone)}
            className="flex items-center gap-2 text-sm text-zinc-900 dark:text-zinc-100 hover:text-orange-500 transition-colors text-left"
          >
            <Phone size={16} className="text-zinc-400" />
            <span>{order.phone}</span>
            <Copy size={12} className="text-zinc-400" />
          </button>
        </div>

        {/* Delivery */}
        <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-4 flex flex-col gap-2">
          <div className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">
            {order.deliveryType === 'delivery' ? 'Доставка' : 'Самовывоз'}
          </div>
          <div className="flex items-start gap-2 text-sm text-zinc-900 dark:text-zinc-100">
            {order.deliveryType === 'delivery' ? (
              <Truck size={16} className="text-zinc-400 mt-0.5 flex-shrink-0" />
            ) : (
              <Store size={16} className="text-zinc-400 mt-0.5 flex-shrink-0" />
            )}
            <button
              onClick={() => copyToClipboard(order.address)}
              className="text-left flex items-start gap-2 hover:text-orange-500 transition-colors"
            >
              <span>{order.address}</span>
              <Copy size={12} className="text-zinc-400 mt-1 flex-shrink-0" />
            </button>
          </div>
          {order.deliveryStatus && (
            <div className="flex items-center gap-2 text-xs text-zinc-500 pt-1 border-t border-zinc-200 dark:border-zinc-700">
              <MapPin size={12} />
              <span>Яндекс Доставка: <b>{order.deliveryStatus}</b></span>
            </div>
          )}
        </div>

        {/* Payment */}
        <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-4 flex flex-col gap-2">
          <div className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Оплата</div>
          <div className="flex items-center gap-2 text-sm text-zinc-900 dark:text-zinc-100">
            <PaymentIcon size={16} className="text-zinc-400" />
            <span className="font-bold">{payment.label}</span>
          </div>
          {payStatus && PayStatusIcon && (
            <div className={cn('flex items-center gap-2 text-xs font-bold', payStatus.color)}>
              <PayStatusIcon size={14} />
              {payStatus.label}
            </div>
          )}
          {!payStatus && order.paymentType === 'cash' && (
            <div className="text-xs text-zinc-500">Оплата при получении</div>
          )}
        </div>

        {/* Comment */}
        {order.comment && (
          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-4 flex flex-col gap-2">
            <div className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Комментарий</div>
            <div className="flex items-start gap-2 text-sm text-zinc-900 dark:text-zinc-100">
              <MessageSquare size={16} className="text-zinc-400 mt-0.5 flex-shrink-0" />
              <span>{order.comment}</span>
            </div>
          </div>
        )}

        {/* Items */}
        <div className="flex flex-col gap-2">
          <div className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest flex items-center gap-2">
            <Package size={12} /> Состав заказа ({order.items.length})
          </div>
          <div className="flex flex-col gap-2">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-3">
                {item.image && (
                  <img src={item.image} alt={item.name} className="w-12 h-12 rounded-xl object-cover bg-zinc-200 dark:bg-zinc-700 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{item.name}</div>
                  <div className="text-xs text-zinc-400">{formatPrice(item.price)} × {item.quantity}</div>
                </div>
                <div className="text-sm font-black text-zinc-900 dark:text-zinc-100">
                  {formatPrice(item.price * item.quantity)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-500">Товары</span>
            <span className="text-zinc-900 dark:text-zinc-100 font-bold">{formatPrice(subtotal)}</span>
          </div>
          {order.deliveryFee > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500">Доставка</span>
              <span className="text-zinc-900 dark:text-zinc-100 font-bold">{formatPrice(order.deliveryFee)}</span>
            </div>
          )}
          {order.discount > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500">Скидка{order.promoCode ? ` (${order.promoCode})` : ''}</span>
              <span className="text-green-500 font-bold">−{formatPrice(order.discount)}</span>
            </div>
          )}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-200 dark:border-zinc-700">
            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Итого</span>
            <span className="text-lg font-black text-zinc-900 dark:text-zinc-100">{formatPrice(order.totalAmount)}</span>
          </div>
        </div>

        {/* Order ID */}
        <button
          onClick={() => copyToClipboard(order.id)}
          className="text-[10px] text-zinc-400 font-mono flex items-center justify-center gap-1 hover:text-orange-500 transition-colors"
        >
          ID: {order.id} <Copy size={10} />
        </button>
      </div>
    </Modal>
  );
};
