import React, { useState, useEffect, useCallback } from 'react';
import { Trash2, Plus, Minus, ShoppingBag, Truck, MapPin, CreditCard, Banknote, Wallet, Loader2, Tag, X } from 'lucide-react';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { formatPrice, cn, formatPhoneNumber } from '../lib/utils';
import { Button } from '../components/Button';
import { FREE_DELIVERY_THRESHOLD, PAYMENT_TYPE_LABELS } from '../constants';
import { apiService } from '../services/apiService';
import { Address, DeliveryEstimate } from '../types';

type PaymentType = 'cash' | 'card' | 'online';

export const CartPage: React.FC = () => {
  const { items, totalAmount, updateQuantity, removeItem, clearCart } = useCart();
  const { user } = useAuth();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [paymentType, setPaymentType] = useState<PaymentType>('cash');

  const [selectedAddress, setSelectedAddress] = useState<Address | null>(user?.addresses?.[0] || null);
  const [manualAddress, setManualAddress] = useState('');
  const [manualHouse, setManualHouse] = useState('');
  const [manualPrivateHouse, setManualPrivateHouse] = useState(false);
  const [manualEntrance, setManualEntrance] = useState('');
  const [manualFloor, setManualFloor] = useState('');
  const [manualIntercom, setManualIntercom] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const [comment, setComment] = useState('');
  const [orderStatus, setOrderStatus] = useState<'idle' | 'loading' | 'success' | 'awaiting_payment' | 'error'>('idle');
  const [orderError, setOrderError] = useState('');
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount: number } | null>(null);
  const [promoError, setPromoError] = useState('');
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  // Delivery calculator state
  const [deliveryEstimate, setDeliveryEstimate] = useState<DeliveryEstimate | null>(null);
  const [isCalculatingDelivery, setIsCalculatingDelivery] = useState(false);

  useEffect(() => {
    if (user) {
      const addrs = Array.isArray(user.addresses) ? user.addresses : [];
      if (!selectedAddress && addrs.length > 0) {
        setSelectedAddress(addrs[0]);
      }
      if (!phone && user.phone) {
        setPhone(formatPhoneNumber(user.phone));
      }
    }
  }, [user]);

  // Calculate delivery cost when address changes
  const calculateDelivery = useCallback(async (addressText: string) => {
    if (!addressText || deliveryType === 'pickup') {
      setDeliveryEstimate(null);
      return;
    }
    setIsCalculatingDelivery(true);
    try {
      const estimate = await apiService.calculateDelivery(addressText);
      setDeliveryEstimate(estimate);
    } catch {
      setDeliveryEstimate(null);
    } finally {
      setIsCalculatingDelivery(false);
    }
  }, [deliveryType]);

  // Debounced delivery calculation for manual address
  useEffect(() => {
    if (deliveryType === 'pickup') {
      setDeliveryEstimate(null);
      return;
    }
    const addressText = selectedAddress
      ? `${selectedAddress.street}, ${selectedAddress.house}`
      : manualHouse ? `${manualAddress}, ${manualHouse}` : manualAddress;

    if (!addressText || addressText.length < 5) {
      setDeliveryEstimate(null);
      return;
    }

    const timer = setTimeout(() => calculateDelivery(addressText), 800);
    return () => clearTimeout(timer);
  }, [selectedAddress, manualAddress, deliveryType, calculateDelivery]);

  // Delivery fee: use estimate if available, else fallback
  const computedDeliveryFee = (() => {
    if (deliveryType === 'pickup') return 0;
    if (deliveryEstimate) {
      if (!deliveryEstimate.available) return 0; // will block checkout
      if (totalAmount >= FREE_DELIVERY_THRESHOLD && deliveryEstimate.fee > 0) return 0; // free delivery promo
      return deliveryEstimate.fee;
    }
    // Fallback when no estimate yet
    return totalAmount >= FREE_DELIVERY_THRESHOLD ? 0 : 150;
  })();

  const discountAmount = appliedPromo?.discount || 0;
  const totalWithDelivery = Math.max(0, totalAmount + computedDeliveryFee - discountAmount);

  useEffect(() => {
    if (appliedPromo) {
      setAppliedPromo(null);
      setPromoError('');
    }
  }, [totalAmount]);

  const handleApplyPromo = async () => {
    const code = promoInput.trim();
    if (!code) {
      setPromoError('Введите промокод');
      return;
    }

    setIsApplyingPromo(true);
    setPromoError('');
    try {
      const result = await apiService.validatePromoCode(code, totalAmount);
      setAppliedPromo({ code: result.promoCode.code, discount: result.discount });
      setPromoInput(result.promoCode.code);
    } catch (error: any) {
      setAppliedPromo(null);
      setPromoError(error.message || 'Промокод не применен');
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const formatAddress = (addr: Address | string) => {
    if (typeof addr === 'string') return addr;
    const parts = [
      'Ростов-на-Дону',
      addr.street,
      addr.house ? `д. ${addr.house}` : '',
      addr.privateHouse ? '[Частный дом]' : '',
      addr.entrance ? `под. ${addr.entrance}` : '',
      addr.floor ? `эт. ${addr.floor}` : '',
      addr.intercom ? `домофон ${addr.intercom}` : '',
      addr.comment ? `(${addr.comment})` : '',
      addr.leaveAtDoor ? '[Оставить у двери]' : ''
    ].filter(Boolean);
    return parts.join(', ');
  };

  const handleCheckout = async () => {
    if (!user) {
      setOrderError('Для оформления заказа необходимо авторизоваться через Telegram');
      setOrderStatus('error');
      return;
    }
    if (!phone) {
      setOrderError('Укажите номер телефона');
      setOrderStatus('error');
      return;
    }
    if (deliveryType === 'delivery' && !selectedAddress && !manualAddress) {
      setOrderError('Укажите адрес доставки');
      setOrderStatus('error');
      return;
    }
    if (deliveryType === 'delivery' && deliveryEstimate && !deliveryEstimate.available) {
      setOrderError(deliveryEstimate.message);
      setOrderStatus('error');
      return;
    }

    setIsCheckingOut(true);
    setOrderStatus('loading');
    setOrderError('');

    const finalAddress = deliveryType === 'pickup'
      ? 'Самовывоз'
      : selectedAddress
        ? formatAddress(selectedAddress)
        : formatAddress({
            street: manualAddress,
            house: manualHouse,
            privateHouse: manualPrivateHouse,
            entrance: manualEntrance,
            floor: manualFloor,
            intercom: manualIntercom,
            leaveAtDoor: false,
          });

    const orderData = {
      userId: user.id,
      items: items.map(i => ({
        productId: i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        image: i.images?.[0] || ''
      })),
      totalAmount: totalWithDelivery,
      deliveryFee: computedDeliveryFee,
      discount: discountAmount,
      promoCode: appliedPromo?.code,
      address: finalAddress,
      phone,
      comment,
      name: user.firstName,
      deliveryType,
      paymentType,
    };

    try {
      const order = await apiService.createOrder(orderData);

      if (paymentType === 'online') {
        // Create YooKassa payment and redirect
        setCreatedOrderId(order.id);
        try {
          const payment = await apiService.createPayment(order.id);
          if (payment.paymentUrl) {
            // Redirect to YooKassa payment page
            window.location.href = payment.paymentUrl;
            return;
          }
          setOrderError('Не удалось получить ссылку на оплату');
          setOrderStatus('error');
        } catch (err: any) {
          setOrderError(err.message || 'Ошибка при создании платежа');
          setOrderStatus('error');
        }
      } else {
        // Cash or card — order is done
        setOrderStatus('success');
        clearCart();
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setOrderError('Не удалось оформить заказ. Попробуйте снова.');
      setOrderStatus('error');
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Check payment status when returning from YooKassa
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const returnedOrderId = params.get('orderId');
    if (!returnedOrderId) return;

    setOrderStatus('awaiting_payment');
    setCreatedOrderId(returnedOrderId);

    const checkStatus = async () => {
      try {
        const { paymentStatus } = await apiService.getPaymentStatus(returnedOrderId);
        if (paymentStatus === 'succeeded') {
          setOrderStatus('success');
          clearCart();
          // Clean URL
          window.history.replaceState({}, '', '/cart');
        } else if (paymentStatus === 'canceled') {
          setOrderError('Оплата отменена. Вы можете попробовать снова.');
          setOrderStatus('error');
          window.history.replaceState({}, '', '/cart');
        } else {
          // Still pending, poll
          setTimeout(checkStatus, 3000);
        }
      } catch {
        setOrderError('Не удалось проверить статус оплаты');
        setOrderStatus('error');
      }
    };

    checkStatus();
  }, []);

  // Awaiting payment screen
  if (orderStatus === 'awaiting_payment') {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center gap-6">
        <div className="w-24 h-24 bg-orange-500 text-white rounded-full flex items-center justify-center shadow-xl shadow-orange-500/20 animate-pulse">
          <CreditCard size={48} />
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">Проверяем оплату...</h2>
          <p className="text-sm text-zinc-400 max-w-[240px]">
            Ожидаем подтверждение от платёжной системы. Это займёт несколько секунд.
          </p>
        </div>
        <Loader2 size={32} className="animate-spin text-orange-500" />
      </div>
    );
  }

  if (orderStatus === 'success') {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center gap-6">
        <div className="w-24 h-24 bg-green-500 text-white rounded-full flex items-center justify-center shadow-xl shadow-green-500/20">
          <ShoppingBag size={48} />
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">Заказ принят!</h2>
          <p className="text-sm text-zinc-400 max-w-[240px]">
            Мы уже начали готовить ваши вкусности. Следите за статусом в профиле.
          </p>
        </div>
        <Button onClick={() => window.location.reload()} className="w-full max-w-[200px]">
          На главную
        </Button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center gap-6">
        <div className="w-24 h-24 bg-zinc-100 dark:bg-zinc-900 text-zinc-400 rounded-full flex items-center justify-center">
          <ShoppingBag size={48} />
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">Корзина пуста</h2>
          <p className="text-sm text-zinc-400">Кажется, вы еще ничего не выбрали</p>
        </div>
        <Button onClick={() => window.location.reload()} className="w-full max-w-[200px]">
          В каталог
        </Button>
      </div>
    );
  }

  const paymentOptions: { type: PaymentType; icon: any; label: string }[] = [
    { type: 'cash', icon: Banknote, label: PAYMENT_TYPE_LABELS.cash },
    { type: 'card', icon: CreditCard, label: PAYMENT_TYPE_LABELS.card },
    { type: 'online', icon: Wallet, label: PAYMENT_TYPE_LABELS.online },
  ];

  const isDeliveryBlocked = deliveryType === 'delivery' && deliveryEstimate && !deliveryEstimate.available;
  const isCheckoutDisabled = (deliveryType === 'delivery' && !selectedAddress && !manualAddress) || !!isDeliveryBlocked;

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">Корзина</h1>

      {/* Items List */}
      <div className="flex flex-col gap-4">
        {items.map((item) => (
          <div key={item.id} className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-100 dark:border-zinc-800 flex gap-4">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-zinc-50 dark:bg-zinc-800">
              <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 flex flex-col justify-between py-1">
              <div className="flex justify-between items-start">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1">{item.name}</h3>
                <button onClick={() => removeItem(item.id)} className="text-zinc-400 hover:text-red-500">
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-orange-500">{formatPrice(item.price)}</span>
                <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800 px-3 py-1.5 rounded-xl">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="text-zinc-400">
                    <Minus size={14} />
                  </button>
                  <span className="text-xs font-bold w-4 text-center text-zinc-900 dark:text-zinc-100">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="text-zinc-400">
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Checkout Section */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-[40px] border border-zinc-100 dark:border-zinc-800 flex flex-col gap-6 shadow-sm">
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100">Оформление</h3>

          {/* Delivery Type */}
          <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-2xl">
            <button
              onClick={() => setDeliveryType('delivery')}
              className={cn(
                "flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2",
                deliveryType === 'delivery' ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-400"
              )}
            >
              <Truck size={14} /> Доставка
            </button>
            <button
              onClick={() => setDeliveryType('pickup')}
              className={cn(
                "flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2",
                deliveryType === 'pickup' ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-400"
              )}
            >
              <MapPin size={14} /> Самовывоз
            </button>
          </div>

          {/* Address + Delivery Calculator */}
          {deliveryType === 'delivery' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-4">Адрес доставки</label>

                {Array.isArray(user?.addresses) && user.addresses.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {user.addresses.map((addr, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedAddress(addr);
                          setManualAddress('');
                        }}
                        className={cn(
                          "flex flex-col items-start p-4 rounded-2xl border transition-all text-left",
                          selectedAddress === addr
                            ? "bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20"
                            : "bg-zinc-50 dark:bg-zinc-800 border-zinc-100 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin size={14} className={cn(selectedAddress === addr ? "text-white" : "text-orange-500")} />
                          <span className="text-sm font-bold">{addr.street}, {addr.house}</span>
                          {addr.privateHouse && <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-bold", selectedAddress === addr ? "bg-white/20 text-white" : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500")}>Частный дом</span>}
                        </div>
                        <div className={cn(
                          "text-[10px] font-medium ml-5 flex flex-wrap gap-x-1",
                          selectedAddress === addr ? "text-white/80" : "text-zinc-400"
                        )}>
                          {addr.entrance && <span>Подъезд {addr.entrance}</span>}
                          {addr.floor && <span>• Этаж {addr.floor}</span>}
                          {addr.intercom && <span>• Домофон {addr.intercom}</span>}
                          {addr.leaveAtDoor && <span>• Оставить у двери</span>}
                        </div>
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        setSelectedAddress(null);
                        setManualAddress('');
                      }}
                      className={cn(
                        "p-4 rounded-2xl border border-dashed transition-all text-sm font-bold",
                        !selectedAddress
                          ? "bg-zinc-100 dark:bg-zinc-800 border-orange-500 text-orange-500"
                          : "bg-transparent border-zinc-200 dark:border-zinc-700 text-zinc-400"
                      )}
                    >
                      + Другой адрес
                    </button>
                  </div>
                ) : null}

                {(!selectedAddress || !Array.isArray(user?.addresses) || user.addresses.length === 0) && (
                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="col-span-2 h-12 px-4 bg-zinc-100 dark:bg-zinc-800/60 rounded-2xl border border-zinc-200 dark:border-zinc-700 flex items-center text-sm font-bold text-zinc-400 dark:text-zinc-500 select-none">
                        г. Ростов-на-Дону
                      </div>
                      <input
                        type="text"
                        value={manualAddress}
                        onChange={(e) => setManualAddress(e.target.value)}
                        placeholder="Улица"
                        className="col-span-2 h-12 px-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                      />
                      <input
                        type="text"
                        value={manualHouse}
                        onChange={(e) => setManualHouse(e.target.value)}
                        placeholder="Дом"
                        className="h-12 px-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                      />
                      <label className="flex items-center gap-2 h-12 px-4 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={manualPrivateHouse}
                          onChange={(e) => { setManualPrivateHouse(e.target.checked); setManualEntrance(''); setManualFloor(''); setManualIntercom(''); }}
                          className="w-4 h-4 rounded accent-orange-500"
                        />
                        <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300">Частный дом</span>
                      </label>
                    </div>
                    {!manualPrivateHouse && (
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={manualEntrance}
                          onChange={(e) => setManualEntrance(e.target.value)}
                          placeholder="Подъезд"
                          className="h-12 px-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                        />
                        <input
                          type="text"
                          value={manualFloor}
                          onChange={(e) => setManualFloor(e.target.value)}
                          placeholder="Этаж"
                          className="h-12 px-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                        />
                        <input
                          type="text"
                          value={manualIntercom}
                          onChange={(e) => setManualIntercom(e.target.value)}
                          placeholder="Домофон"
                          className="h-12 px-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Delivery Estimate Badge (Yandex Delivery) */}
              {(isCalculatingDelivery || deliveryEstimate) && (
                <div className={cn(
                  "flex items-center gap-3 p-4 rounded-2xl border",
                  isCalculatingDelivery
                    ? "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                    : deliveryEstimate?.available
                      ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                      : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                )}>
                  {isCalculatingDelivery ? (
                    <>
                      <Loader2 size={16} className="animate-spin text-zinc-400" />
                      <span className="text-xs font-medium text-zinc-400">Запрашиваем стоимость у Яндекс Доставки...</span>
                    </>
                  ) : deliveryEstimate ? (
                    <>
                      <Truck size={16} className={deliveryEstimate.available ? "text-green-500" : "text-red-500"} />
                      <div className="flex flex-col">
                        <span className={cn(
                          "text-xs font-bold",
                          deliveryEstimate.available ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"
                        )}>
                          {deliveryEstimate.message}
                        </span>
                        {deliveryEstimate.estimatedMinutes && (
                          <span className="text-[10px] text-zinc-400">
                            Время доставки: ~{deliveryEstimate.estimatedMinutes} мин
                          </span>
                        )}
                        {deliveryEstimate.yandexAvailable && (
                          <span className="text-[10px] text-zinc-400 flex items-center gap-1 mt-0.5">
                            Курьер Яндекс Доставки
                          </span>
                        )}
                      </div>
                    </>
                  ) : null}
                </div>
              )}
            </div>
          )}

          {/* Phone */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-4">Телефон</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
              placeholder="+7 (999) 999 99-99"
              className="w-full h-12 px-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
            />
          </div>

          {/* Comment */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-4">Комментарий к заказу</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Например: код домофона 123"
              className="w-full h-24 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 resize-none"
            />
          </div>

          {/* Promo Code */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-4">Промокод</label>
            {appliedPromo ? (
              <div className="flex items-center justify-between p-4 rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3">
                  <Tag size={18} className="text-green-600 dark:text-green-400" />
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-green-700 dark:text-green-300">{appliedPromo.code}</span>
                    <span className="text-xs text-green-600 dark:text-green-400">Скидка {formatPrice(appliedPromo.discount)}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setAppliedPromo(null); setPromoError(''); }}
                  className="p-2 text-green-700 dark:text-green-300"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoInput}
                  onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoError(''); }}
                  placeholder="ROSTOV20"
                  className="min-w-0 flex-1 h-12 px-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 text-sm font-bold uppercase text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                />
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  disabled={isApplyingPromo}
                  className="h-12 px-4 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-black disabled:opacity-50"
                >
                  {isApplyingPromo ? <Loader2 size={16} className="animate-spin" /> : 'OK'}
                </button>
              </div>
            )}
            {promoError && <p className="text-xs font-medium text-red-500 ml-4">{promoError}</p>}
          </div>

          {/* Payment Type */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-4">Способ оплаты</label>
            <div className="flex flex-col gap-2">
              {paymentOptions.map(opt => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.type}
                    onClick={() => setPaymentType(opt.type)}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-2xl border transition-all",
                      paymentType === opt.type
                        ? "bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20"
                        : "bg-zinc-50 dark:bg-zinc-800 border-zinc-100 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                    )}
                  >
                    <Icon size={18} className={paymentType === opt.type ? "text-white" : "text-orange-500"} />
                    <span className="text-sm font-bold">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="flex flex-col gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Сумма</span>
            <span className="font-bold text-zinc-900 dark:text-zinc-100">{formatPrice(totalAmount)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Скидка{appliedPromo?.code ? ` (${appliedPromo.code})` : ''}</span>
              <span className="font-bold text-green-500">-{formatPrice(discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Доставка</span>
            <span className="font-bold text-green-500">
              {deliveryType === 'pickup'
                ? 'Самовывоз'
                : computedDeliveryFee === 0
                  ? 'Бесплатно'
                  : formatPrice(computedDeliveryFee)
              }
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Оплата</span>
            <span className="font-bold text-zinc-900 dark:text-zinc-100">{PAYMENT_TYPE_LABELS[paymentType]}</span>
          </div>
          <div className="flex justify-between text-lg pt-2">
            <span className="font-black text-zinc-900 dark:text-zinc-100">Итого</span>
            <span className="font-black text-orange-500">{formatPrice(totalWithDelivery)}</span>
          </div>
        </div>

        {orderError && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl">
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">{orderError}</p>
          </div>
        )}

        <Button
          onClick={handleCheckout}
          isLoading={isCheckingOut}
          className="w-full h-16 rounded-[24px]"
          disabled={isCheckoutDisabled}
        >
          {paymentType === 'online' ? 'Оплатить онлайн' : 'Заказать'}
        </Button>
      </div>
    </div>
  );
};
