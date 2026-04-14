import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Package, ShoppingBag, Users, Plus, Edit2, Trash2, FolderTree, Image, Database, ChevronRight, CreditCard, Banknote, Wallet, MapPin } from 'lucide-react';
import { apiService } from '../services/apiService';
import { Product, Order, Category, User, Banner, ROLE_LABELS, UserRole, ADMIN_ROLES } from '../types';
import { formatPrice, cn } from '../lib/utils';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../constants';
import { Button } from '../components/Button';
import { ProductModal } from '../components/admin/ProductModal';
import { CategoryModal } from '../components/admin/CategoryModal';
import { BannerModal } from '../components/admin/BannerModal';
import { OrderDetailsModal } from '../components/OrderDetailsModal';
import { useAuth } from '../hooks/useAuth';

type AdminTab = 'dashboard' | 'products' | 'categories' | 'orders' | 'users' | 'banners';

export const AdminPage: React.FC = () => {
  const { user: currentUser, canManageRoles } = useAuth();
  const isCourier = currentUser?.role === 'courier';
  const [activeTab, setActiveTab] = useState<AdminTab>(isCourier ? 'orders' : 'dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [p, c, o, u, s, b] = await Promise.all([
        apiService.getProducts().catch(() => []),
        apiService.getCategories().catch(() => []),
        apiService.getAdminOrders().catch(() => []),
        apiService.getAdminUsers().catch(() => []),
        apiService.getAdminStats().catch(() => ({ orderCount: 0, revenue: 0, userCount: 0, productCount: 0 })),
        apiService.getAdminBanners().catch(() => []),
      ]);
      setProducts(p);
      setCategories(c);
      setOrders(o);
      setUsers(u);
      setStats(s);
      setBanners(b);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      await apiService.updateOrderStatus(orderId, status);
      setOrders(orders.map(o => o.id === orderId ? { ...o, status } : o));
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  const handleSaveProduct = async (productData: any) => {
    try {
      if (editingProduct) {
        await apiService.updateProduct(editingProduct.id, productData);
      } else {
        await apiService.createProduct(productData);
      }
      setIsProductModalOpen(false);
      setEditingProduct(null);
      fetchData();
    } catch (error) {
      console.error('Failed to save product:', error);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Удалить товар?')) return;
    try {
      await apiService.deleteProduct(id);
      fetchData();
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  const handleSaveCategory = async (categoryData: any) => {
    try {
      if (editingCategory) {
        await apiService.updateCategory(editingCategory.id, categoryData);
      } else {
        await apiService.createCategory(categoryData);
      }
      setIsCategoryModalOpen(false);
      setEditingCategory(null);
      fetchData();
    } catch (error) {
      console.error('Failed to save category:', error);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Удалить категорию?')) return;
    try {
      await apiService.deleteCategory(id);
      fetchData();
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  const handleSaveBanner = async (bannerData: any) => {
    try {
      if (editingBanner) {
        await apiService.updateBanner(editingBanner.id, bannerData);
      } else {
        await apiService.createBanner(bannerData);
      }
      setIsBannerModalOpen(false);
      setEditingBanner(null);
      fetchData();
    } catch (error) {
      console.error('Failed to save banner:', error);
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!window.confirm('Удалить баннер?')) return;
    try {
      await apiService.deleteBanner(id);
      fetchData();
    } catch (error) {
      console.error('Failed to delete banner:', error);
    }
  };

  const handleSeedDatabase = async () => {
    if (!window.confirm('Заполнить базу данных демо-данными? Существующие товары, категории и баннеры будут удалены.')) return;
    setIsSeeding(true);
    try {
      await apiService.seedDatabase();
      await fetchData();
      alert('База данных заполнена!');
    } catch (error) {
      console.error('Seed error:', error);
      alert('Ошибка при заполнении базы данных');
    } finally {
      setIsSeeding(false);
    }
  };

  if (isLoading) return <div className="p-8 animate-pulse text-zinc-900 dark:text-zinc-100">Загрузка админки...</div>;

  const allTabs: { id: AdminTab; label: string; icon: any }[] = [
    { id: 'dashboard', label: 'Дашборд', icon: LayoutDashboard },
    { id: 'products', label: 'Товары', icon: Package },
    { id: 'categories', label: 'Категории', icon: FolderTree },
    { id: 'banners', label: 'Баннеры', icon: Image },
    { id: 'orders', label: 'Заказы', icon: ShoppingBag },
    { id: 'users', label: 'Клиенты', icon: Users },
  ];

  // Курьер видит только заказы
  const tabs = isCourier ? allTabs.filter(t => t.id === 'orders') : allTabs;

  return (
    <div className="flex flex-col gap-8 pb-20">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-100">
            {isCourier ? 'Заказы' : 'Админ-панель'}
          </h1>
          {!isCourier && (
            <button
              onClick={handleSeedDatabase}
              disabled={isSeeding}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 text-orange-500 text-[10px] font-bold rounded-full hover:bg-orange-500/20 transition-colors disabled:opacity-50"
            >
              <Database size={12} />
              {isSeeding ? 'Загрузка...' : 'Seed DB'}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold transition-all whitespace-nowrap",
                  activeTab === tab.id
                    ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                    : "bg-white dark:bg-zinc-900 text-zinc-400 border border-zinc-100 dark:border-zinc-800"
                )}
              >
                <Icon size={16} /> {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dashboard */}
      {activeTab === 'dashboard' && stats && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-[32px] border border-zinc-100 dark:border-zinc-800">
            <span className="text-3xl font-black text-zinc-900 dark:text-zinc-100">{stats.orderCount}</span>
            <p className="text-xs text-zinc-400 font-bold uppercase mt-1">Всего заказов</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-[32px] border border-zinc-100 dark:border-zinc-800">
            <span className="text-3xl font-black text-zinc-900 dark:text-zinc-100">{formatPrice(stats.revenue)}</span>
            <p className="text-xs text-zinc-400 font-bold uppercase mt-1">Выручка</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-[32px] border border-zinc-100 dark:border-zinc-800">
            <span className="text-3xl font-black text-zinc-900 dark:text-zinc-100">{stats.userCount}</span>
            <p className="text-xs text-zinc-400 font-bold uppercase mt-1">Клиентов</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-[32px] border border-zinc-100 dark:border-zinc-800">
            <span className="text-3xl font-black text-zinc-900 dark:text-zinc-100">{stats.productCount}</span>
            <p className="text-xs text-zinc-400 font-bold uppercase mt-1">Товаров</p>
          </div>
        </div>
      )}

      {/* Products */}
      {activeTab === 'products' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100">Управление товарами</h2>
            <Button size="sm" className="rounded-xl" onClick={() => { setEditingProduct(null); setIsProductModalOpen(true); }}>
              <Plus size={16} /> Добавить
            </Button>
          </div>
          {products.length === 0 ? (
            <div className="py-12 bg-white dark:bg-zinc-900 rounded-[32px] border border-zinc-100 dark:border-zinc-800 flex flex-col items-center justify-center text-center gap-2">
              <Package size={32} className="text-zinc-300" />
              <p className="text-sm text-zinc-400 font-medium">Товаров пока нет</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {products.map(product => (
                <div key={product.id} className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img src={product.images[0]} className="w-12 h-12 rounded-xl object-cover bg-zinc-100 dark:bg-zinc-800" />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{product.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-orange-500 font-bold">{formatPrice(product.price)}</span>
                        {!product.isAvailable && <span className="text-[10px] text-red-500 font-bold uppercase">скрыт</span>}
                        {product.isPopular && <span className="text-[10px] text-orange-400 font-bold uppercase">хит</span>}
                        {product.isNew && <span className="text-[10px] text-green-500 font-bold uppercase">new</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setEditingProduct(product); setIsProductModalOpen(true); }}
                      className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="p-2 text-zinc-400 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Categories */}
      {activeTab === 'categories' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100">Управление категориями</h2>
            <Button size="sm" className="rounded-xl" onClick={() => { setEditingCategory(null); setIsCategoryModalOpen(true); }}>
              <Plus size={16} /> Добавить
            </Button>
          </div>
          {categories.length === 0 ? (
            <div className="py-12 bg-white dark:bg-zinc-900 rounded-[32px] border border-zinc-100 dark:border-zinc-800 flex flex-col items-center justify-center text-center gap-2">
              <FolderTree size={32} className="text-zinc-300" />
              <p className="text-sm text-zinc-400 font-medium">Категорий пока нет</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {categories.map(category => (
                <div key={category.id} className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {category.image && <img src={category.image} className="w-12 h-12 rounded-xl object-cover bg-zinc-100 dark:bg-zinc-800" />}
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{category.name}</span>
                      <span className="text-xs text-zinc-400">/{category.slug}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setEditingCategory(category); setIsCategoryModalOpen(true); }}
                      className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="p-2 text-zinc-400 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Banners */}
      {activeTab === 'banners' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100">Управление баннерами</h2>
            <Button size="sm" className="rounded-xl" onClick={() => { setEditingBanner(null); setIsBannerModalOpen(true); }}>
              <Plus size={16} /> Добавить
            </Button>
          </div>
          {banners.length === 0 ? (
            <div className="py-12 bg-white dark:bg-zinc-900 rounded-[32px] border border-zinc-100 dark:border-zinc-800 flex flex-col items-center justify-center text-center gap-2">
              <Image size={32} className="text-zinc-300" />
              <p className="text-sm text-zinc-400 font-medium">Баннеров пока нет</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {banners.map(banner => (
                <div key={banner.id} className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img src={banner.image} className="w-16 h-10 rounded-xl object-cover bg-zinc-100 dark:bg-zinc-800" />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{banner.title}</span>
                      <div className="flex items-center gap-2">
                        {banner.subtitle && <span className="text-xs text-zinc-400">{banner.subtitle}</span>}
                        {!banner.isActive && <span className="text-[10px] text-red-500 font-bold uppercase">скрыт</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setEditingBanner(banner); setIsBannerModalOpen(true); }}
                      className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteBanner(banner.id)}
                      className="p-2 text-zinc-400 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Orders */}
      {activeTab === 'orders' && (
        <div className="flex flex-col gap-4">
          {!isCourier && <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100">Последние заказы</h2>}
          {orders.length === 0 ? (
            <div className="py-12 bg-white dark:bg-zinc-900 rounded-[32px] border border-zinc-100 dark:border-zinc-800 flex flex-col items-center justify-center text-center gap-2">
              <ShoppingBag size={32} className="text-zinc-300" />
              <p className="text-sm text-zinc-400 font-medium">Заказов пока нет</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {orders.map(order => {
                const PayIcon = order.paymentType === 'cash' ? Banknote : order.paymentType === 'card' ? Wallet : CreditCard;
                const isPaid = order.paymentStatus === 'succeeded';
                // Парсим адрес: "Ростов-на-Дону, улица, д. X, под. Y, ..."
                const addressParts = order.address.split(',').map((s: string) => s.trim());
                // Город + улица + дом (первые 3 части)
                const mainAddress = addressParts.slice(0, 3).join(', ');
                const extraInfo = addressParts.slice(3).join(', '); // подъезд, комментарий и тд
                // Для навигации: город + улица + номер дома (без "д.")
                const navAddress = addressParts.slice(0, 3).join(', ').replace(/\bд\.\s*/g, '');
                const openNav = (e: React.MouseEvent) => {
                  e.preventDefault();
                  const url = `https://yandex.ru/maps/?mode=routes&rtext=~${encodeURIComponent(navAddress)}&rtt=auto`;
                  // Telegram WebApp
                  if (window.Telegram?.WebApp?.openLink) {
                    window.Telegram.WebApp.openLink(url);
                  // MAX WebApp
                  } else if ((window as any).WebApp?.openLink) {
                    (window as any).WebApp.openLink(url);
                  } else {
                    window.open(url, '_blank');
                  }
                };

                return (
                  <div key={order.id} className="bg-white dark:bg-zinc-900 p-6 rounded-[32px] border border-zinc-100 dark:border-zinc-800 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="flex flex-col text-left active:opacity-70 transition-opacity"
                      >
                        <span className="text-sm font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
                          #{order.id.slice(-6)} <ChevronRight size={14} className="text-zinc-400" />
                        </span>
                        <span className="text-xs text-zinc-400 font-medium">{order.name}, {order.phone}</span>
                      </button>
                      {!isCourier ? (
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value as any)}
                          className={cn(
                            "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase text-white border-none outline-none cursor-pointer",
                            ORDER_STATUS_COLORS[order.status]
                          )}
                        >
                          {Object.entries(ORDER_STATUS_LABELS).map(([val, label]) => (
                            <option key={val} value={val} className="bg-white text-zinc-900">{label}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={cn(
                          "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase text-white",
                          ORDER_STATUS_COLORS[order.status]
                        )}>
                          {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS]}
                        </span>
                      )}
                    </div>

                    {/* Address */}
                    {order.deliveryType === 'delivery' && order.address !== 'Самовывоз' ? (
                      <div className="flex flex-col gap-1.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-3">
                        <button
                          onClick={openNav}
                          className="flex items-start gap-2 text-sm font-bold text-blue-600 dark:text-blue-400 underline decoration-blue-300 dark:decoration-blue-700 underline-offset-2 text-left"
                        >
                          <MapPin size={16} className="shrink-0 mt-0.5" />
                          {mainAddress}
                        </button>
                        {extraInfo && (
                          <span className="text-[11px] text-zinc-500 dark:text-zinc-400 ml-6">{extraInfo}</span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-3 text-xs text-zinc-500">
                        <span>🏪</span> Самовывоз
                      </div>
                    )}

                    {/* Payment info */}
                    <div className="flex items-center gap-2 text-xs">
                      <PayIcon size={12} className="text-zinc-400" />
                      <span className="text-zinc-600 dark:text-zinc-300 font-medium">
                        {order.paymentType === 'cash' ? 'Наличные' : order.paymentType === 'card' ? 'Карта курьеру' : 'Онлайн'}
                      </span>
                      {order.paymentType === 'online' && (
                        <span className={cn(
                          'text-[10px] font-black uppercase px-2 py-0.5 rounded-full',
                          isPaid ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
                        )}>
                          {isPaid ? 'Оплачено' : (order.paymentStatus || 'Не оплачено')}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
                      <span className="text-sm font-black text-zinc-900 dark:text-zinc-100">{formatPrice(order.totalAmount)}</span>
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-orange-500 text-xs font-bold flex items-center gap-1"
                      >
                        Подробнее <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Users */}
      {activeTab === 'users' && (
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100">Клиенты</h2>
          {users.length === 0 ? (
            <div className="py-12 bg-white dark:bg-zinc-900 rounded-[32px] border border-zinc-100 dark:border-zinc-800 flex flex-col items-center justify-center text-center gap-2">
              <Users size={32} className="text-zinc-300" />
              <p className="text-sm text-zinc-400 font-medium">Клиентов пока нет</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {users.map(user => (
                <div key={user.id} className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-100 dark:border-zinc-800 flex flex-col gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 shrink-0 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400 font-bold overflow-hidden">
                      {user.photoUrl ? (
                        <img src={user.photoUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        (user.firstName || '?')[0]
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {user.firstName || 'Без имени'} {user.lastName || ''}
                      </span>
                      <span className="text-xs text-zinc-400 truncate">{user.phone || 'Нет телефона'}</span>
                      {user.username && (
                        <span className="text-[10px] text-zinc-300 dark:text-zinc-600 truncate">@{user.username}</span>
                      )}
                    </div>
                    <span className={cn(
                      "ml-auto shrink-0 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full whitespace-nowrap",
                      (user.role === 'superadmin' || user.role === 'admin') ? "bg-red-500/10 text-red-500" :
                      user.role === 'support' ? "bg-blue-500/10 text-blue-500" :
                      user.role === 'restaurant' ? "bg-green-500/10 text-green-500" :
                      user.role === 'courier' ? "bg-purple-500/10 text-purple-500" :
                      "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                    )}>
                      {ROLE_LABELS[user.role] || user.role}
                    </span>
                  </div>
                  {canManageRoles && currentUser?.id !== user.id && (
                    <select
                      value={user.role}
                      onChange={async (e) => {
                        const newRole = e.target.value as UserRole;
                        try {
                          await apiService.updateUserRole(user.id, newRole, currentUser!.id);
                          setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u));
                        } catch (err: any) {
                          alert(err.message || 'Ошибка смены роли');
                        }
                      }}
                      className="w-full text-xs bg-zinc-100 dark:bg-zinc-800 rounded-xl px-3 py-2 text-zinc-700 dark:text-zinc-300 outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="user">Клиент</option>
                      <option value="courier">Курьер</option>
                      <option value="restaurant">Ресторан</option>
                      <option value="support">Тех. поддержка</option>
                      {(currentUser?.role === 'superadmin' || currentUser?.role === 'admin') && (
                        <option value="superadmin">Главный админ</option>
                      )}
                    </select>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => { setIsProductModalOpen(false); setEditingProduct(null); }}
        onSave={handleSaveProduct}
        product={editingProduct}
        categories={categories}
      />

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => { setIsCategoryModalOpen(false); setEditingCategory(null); }}
        onSave={handleSaveCategory}
        category={editingCategory}
      />

      <BannerModal
        isOpen={isBannerModalOpen}
        onClose={() => { setIsBannerModalOpen(false); setEditingBanner(null); }}
        onSave={handleSaveBanner}
        banner={editingBanner}
      />

      <OrderDetailsModal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        order={selectedOrder}
      />
    </div>
  );
};
