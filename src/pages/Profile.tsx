import React, { useState, useEffect } from 'react';
import { User as UserIcon, MapPin, History, Settings, LogOut, ChevronRight, Package, Clock, X, Plus, Heart, Trash2, Sun, Moon } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';
import { Order, Product, Address } from '../types';
import { formatPrice, cn, formatPhoneNumber } from '../lib/utils';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../constants';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { ProductCard } from '../components/ProductCard';
import { ProductDetailModal } from '../components/ProductDetailModal';
import { OrderDetailsModal } from '../components/OrderDetailsModal';

export const ProfilePage: React.FC = () => {
  const { user, isAdmin, setUser } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<'addresses' | 'settings' | 'favorites' | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showAllOrders, setShowAllOrders] = useState(false);

  // Address form state
  const [addressForm, setAddressForm] = useState<Address>({
    street: '',
    house: '',
    entrance: '',
    comment: '',
    leaveAtDoor: false
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const [ordersData, productsData] = await Promise.all([
          apiService.getUserOrders(user.id),
          apiService.getProducts()
        ]);
        setOrders(ordersData);
        setAllProducts(productsData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const userFavorites = Array.isArray(user?.favorites) ? user.favorites : [];
  const favoriteProducts = allProducts.filter(p => userFavorites.includes(p.id));

  const handleUpdateProfile = async (data: { phone?: string; addresses?: Address[]; favorites?: string[] }) => {
    if (!user) return;
    setIsUpdating(true);
    try {
      const updatedUser = await apiService.updateProfile(user.id, data);
      setUser(updatedUser);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddAddress = async () => {
    if (!addressForm.street || !addressForm.house || !user) return;
    const currentAddresses = Array.isArray(user.addresses) ? [...user.addresses] : [];
    const newAddress = { ...addressForm };
    try {
      await handleUpdateProfile({ addresses: [...currentAddresses, newAddress] });
      setAddressForm({ street: '', house: '', entrance: '', comment: '', leaveAtDoor: false });
    } catch (error) {
      console.error('Failed to add address:', error);
    }
  };

  const handleDeleteAddress = async (idx: number) => {
    if (!user) return;
    const currentAddresses = Array.isArray(user.addresses) ? [...user.addresses] : [];
    currentAddresses.splice(idx, 1);
    await handleUpdateProfile({ addresses: currentAddresses });
  };

  const handleToggleFavorite = async (productId: string) => {
    if (!user) return;
    try {
      const updatedUser = await apiService.toggleFavorite(user.id, productId);
      setUser(updatedUser);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark'));

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
    }
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-orange-500 rounded-[32px] flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-orange-500/20 overflow-hidden">
            {user?.photoUrl ? (
              <img src={user.photoUrl} alt={user.firstName} className="w-full h-full object-cover" />
            ) : (
              user?.firstName?.[0] || 'U'
            )}
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
              {user?.firstName} {user?.lastName}
            </h1>
            <p className="text-sm text-zinc-400 font-medium">@{user?.username || 'user'}</p>
            {isAdmin && user?.role && (
              <span className={cn(
                "mt-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full w-fit",
                user.role === 'superadmin' ? "bg-red-500/10 text-red-500" :
                user.role === 'support' ? "bg-blue-500/10 text-blue-500" :
                user.role === 'restaurant' ? "bg-green-500/10 text-green-500" :
                "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
              )}>
                {{ superadmin: 'Главный админ', support: 'Тех. поддержка', restaurant: 'Ресторан' }[user.role] || 'Админ'}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={toggleDarkMode}
          className="p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 text-zinc-500 hover:text-orange-500 active:scale-95 transition-all"
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-[32px] border border-zinc-100 dark:border-zinc-800 flex flex-col gap-1">
          <span className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{orders.length}</span>
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Заказов</span>
        </div>
      </div>

      {/* History */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100">История заказов</h2>
          {orders.length > 3 && (
            <button
              onClick={() => setShowAllOrders(!showAllOrders)}
              className="text-xs font-bold text-orange-500 flex items-center gap-1 active:scale-95 transition-transform"
            >
              {showAllOrders ? 'Свернуть' : `Все (${orders.length})`}
              <ChevronRight size={14} className={cn("transition-transform", showAllOrders && "rotate-90")} />
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2].map(i => <div key={i} className="h-24 bg-zinc-200 dark:bg-zinc-800 rounded-3xl" />)}
          </div>
        ) : orders.length > 0 ? (
          <div className="flex flex-col gap-4">
            {(showAllOrders ? orders : orders.slice(0, 3)).map((order) => (
              <button
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className="bg-white dark:bg-zinc-900 p-5 rounded-[32px] border border-zinc-100 dark:border-zinc-800 flex flex-col gap-4 text-left active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                      {format(new Date(order.createdAt), 'd MMMM, HH:mm', { locale: ru })}
                    </span>
                    <span className="text-sm font-black text-zinc-900 dark:text-zinc-100">Заказ #{order.id.slice(-6)}</span>
                  </div>
                  <div className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase text-white",
                    ORDER_STATUS_COLORS[order.status as keyof typeof ORDER_STATUS_COLORS]
                  )}>
                    {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS]}
                  </div>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-50 dark:bg-zinc-800 flex-shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800 w-full">
                  <span className="text-sm font-black text-zinc-900 dark:text-zinc-100">{formatPrice(order.totalAmount)}</span>
                  <span className="text-orange-500 text-xs font-bold flex items-center gap-1">
                    Детали <ChevronRight size={14} />
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="py-12 bg-white dark:bg-zinc-900 rounded-[32px] border border-zinc-100 dark:border-zinc-800 flex flex-col items-center justify-center text-center gap-2">
            <Package size={32} className="text-zinc-300" />
            <p className="text-sm text-zinc-400 font-medium">У вас пока нет заказов</p>
          </div>
        )}
      </div>

      {/* Settings */}
      <div className="flex flex-col gap-3">
        <button 
          onClick={() => setActiveModal('favorites')}
          className="flex items-center justify-between p-5 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 active:scale-95 transition-transform"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-500">
              <Heart size={20} />
            </div>
            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Избранное</span>
          </div>
          <div className="flex items-center gap-2">
            {favoriteProducts.length > 0 && (
              <span className="bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                {favoriteProducts.length}
              </span>
            )}
            <ChevronRight size={18} className="text-zinc-400" />
          </div>
        </button>
        <button 
          onClick={() => setActiveModal('addresses')}
          className="flex items-center justify-between p-5 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 active:scale-95 transition-transform"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-500">
              <MapPin size={20} />
            </div>
            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Мои адреса</span>
          </div>
          <ChevronRight size={18} className="text-zinc-400" />
        </button>
        <button 
          onClick={() => setActiveModal('settings')}
          className="flex items-center justify-between p-5 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 active:scale-95 transition-transform"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-500">
              <Settings size={20} />
            </div>
            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Настройки</span>
          </div>
          <ChevronRight size={18} className="text-zinc-400" />
        </button>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-t-[40px] sm:rounded-[40px] max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
            >
              {/* Modal Header */}
              <div className="p-6 pb-4 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800">
                <h3 className="text-xl font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100">
                  {activeModal === 'addresses' ? 'Мои адреса' : activeModal === 'favorites' ? 'Избранное' : 'Настройки'}
                </h3>
                <button 
                  onClick={() => setActiveModal(null)}
                  className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-500 hover:scale-105 active:scale-95 transition-transform"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6 pt-4 no-scrollbar">
                {activeModal === 'addresses' ? (
                  <div className="flex flex-col gap-8">
                    <div className="flex flex-col gap-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5 col-span-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 px-1">Улица</label>
                          <input 
                            type="text"
                            value={addressForm.street}
                            onChange={(e) => setAddressForm(prev => ({ ...prev, street: e.target.value }))}
                            placeholder="пр-т Ленина"
                            className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-2xl px-5 py-4 text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none border-2 border-transparent focus:border-orange-500 transition-all"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 px-1">Дом</label>
                          <input 
                            type="text"
                            value={addressForm.house}
                            onChange={(e) => setAddressForm(prev => ({ ...prev, house: e.target.value }))}
                            placeholder="10/2"
                            className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-2xl px-5 py-4 text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none border-2 border-transparent focus:border-orange-500 transition-all"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 px-1">Подъезд</label>
                          <input 
                            type="text"
                            value={addressForm.entrance}
                            onChange={(e) => setAddressForm(prev => ({ ...prev, entrance: e.target.value }))}
                            placeholder="3"
                            className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-2xl px-5 py-4 text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none border-2 border-transparent focus:border-orange-500 transition-all"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5 col-span-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 px-1">Комментарий курьеру</label>
                          <textarea 
                            value={addressForm.comment}
                            onChange={(e) => setAddressForm(prev => ({ ...prev, comment: e.target.value }))}
                            placeholder="Код домофона, этаж..."
                            className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-2xl px-5 py-4 text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none border-2 border-transparent focus:border-orange-500 transition-all resize-none h-24"
                          />
                        </div>
                      </div>
                      
                      <label className="flex items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 cursor-pointer group">
                        <div className="relative flex items-center">
                          <input 
                            type="checkbox"
                            checked={addressForm.leaveAtDoor}
                            onChange={(e) => setAddressForm(prev => ({ ...prev, leaveAtDoor: e.target.checked }))}
                            className="sr-only peer"
                          />
                          <div className="w-10 h-6 bg-zinc-200 dark:bg-zinc-700 rounded-full peer peer-checked:bg-orange-500 transition-colors" />
                          <div className="absolute left-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4 shadow-sm" />
                        </div>
                        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-orange-500 transition-colors">Оставить у двери</span>
                      </label>

                      <button 
                        onClick={handleAddAddress}
                        disabled={isUpdating || !addressForm.street || !addressForm.house}
                        className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-orange-600 active:scale-[0.98] transition-all shadow-lg shadow-orange-500/20"
                      >
                        <Plus size={20} /> Добавить адрес
                      </button>
                    </div>

                    <div className="flex flex-col gap-3 mt-8">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 px-1">Сохраненные адреса</h4>
                      {user?.addresses && user.addresses.length > 0 ? (
                        user.addresses.map((address, idx) => (
                          <div key={idx} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 group hover:border-orange-500/30 transition-colors">
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-2">
                                <MapPin size={14} className="text-orange-500" />
                                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{address.street}, {address.house}</span>
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-medium ml-5">
                                {address.entrance && <span>Подъезд {address.entrance}</span>}
                                {address.leaveAtDoor && <span>• Оставить у двери</span>}
                              </div>
                            </div>
                            <button 
                              onClick={() => handleDeleteAddress(idx)}
                              disabled={isUpdating}
                              className="text-zinc-400 hover:text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="py-8 flex flex-col items-center justify-center text-center gap-2 opacity-30">
                          <MapPin size={32} />
                          <p className="text-xs font-bold uppercase tracking-widest">Адреса не добавлены</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : activeModal === 'favorites' ? (
                  <div className="flex flex-col gap-6">
                    <div className="grid grid-cols-2 gap-4 p-1">
                      {favoriteProducts.length > 0 ? (
                        favoriteProducts.map(product => (
                          <ProductCard 
                            key={product.id} 
                            product={product} 
                            isFavorite={true}
                            onFavoriteToggle={() => handleToggleFavorite(product.id)}
                            onClick={() => setSelectedProduct(product)}
                          />
                        ))
                      ) : (
                        <div className="col-span-2 py-12 flex flex-col items-center justify-center text-center gap-3 opacity-50">
                          <Heart size={48} />
                          <div className="flex flex-col gap-1">
                            <p className="text-sm font-black uppercase tracking-widest">Список пуст</p>
                            <p className="text-xs font-medium">Добавляйте товары в избранное, чтобы быстро их находить</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-8">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 px-1">Номер телефона</label>
                      <div className="flex gap-2">
                        <input
                          type="tel"
                          defaultValue={user?.phone ? formatPhoneNumber(user.phone) : ''}
                          onChange={(e) => {
                            e.target.value = formatPhoneNumber(e.target.value);
                          }}
                          onBlur={(e) => {
                            const formatted = formatPhoneNumber(e.target.value);
                            if (formatted !== (user?.phone || '')) {
                              handleUpdateProfile({ phone: formatted });
                            }
                          }}
                          placeholder="+7 (999) 999 99-99"
                          className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-2xl px-5 py-4 text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none border-2 border-transparent focus:border-orange-500 transition-all"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Уведомления</span>
                          <span className="text-[10px] text-zinc-400 font-medium">Статус заказа и акции</span>
                        </div>
                        <div className="w-12 h-6 bg-orange-500 rounded-full relative p-1 cursor-pointer">
                          <div className="w-4 h-4 bg-white rounded-full absolute right-1 shadow-sm" />
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 hover:border-orange-500/30 transition-colors cursor-pointer group">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold group-hover:text-orange-500 transition-colors">Язык приложения</span>
                          <span className="text-[10px] text-zinc-400 font-medium">Русский</span>
                        </div>
                        <ChevronRight size={18} className="text-zinc-400 group-hover:text-orange-500 transition-colors" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 pt-4 pb-10 sm:pb-6 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                <button 
                  onClick={() => setActiveModal(null)}
                  className="w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl"
                >
                  {isUpdating ? 'Сохранение...' : 'Готово'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ProductDetailModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        isFavorite={selectedProduct ? userFavorites.includes(selectedProduct.id) : false}
        onFavoriteToggle={() => selectedProduct && handleToggleFavorite(selectedProduct.id)}
      />

      <OrderDetailsModal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        order={selectedOrder}
      />
    </div>
  );
};
