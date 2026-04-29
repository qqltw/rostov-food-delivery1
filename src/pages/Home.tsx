import React from 'react';
import { Search, Bell, MapPin } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useProducts } from '../hooks/useProducts';
import { ProductCard } from '../components/ProductCard';
import { ProductDetailModal } from '../components/ProductDetailModal';
import { motion } from 'motion/react';
import { formatPrice } from '../lib/utils';
import { Product } from '../types';
import { apiService } from '../services/apiService';

interface HomePageProps {
  onSelectCategory?: (categoryId: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onSelectCategory }) => {
  const { user, setUser } = useAuth();
  const { products, categories, banners, isLoading } = useProducts();
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);

  const handleToggleFavorite = async (productId: string) => {
    if (!user) return;
    try {
      const updatedUser = await apiService.toggleFavorite(user.id, productId);
      setUser(updatedUser);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const popularProducts = products.filter(p => p.isPopular);
  const newProducts = products.filter(p => p.isNew);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8">
        <div className="h-12 w-48 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-2xl" />
        <div className="h-48 w-full bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-[40px]" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="aspect-square bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-zinc-400 text-xs font-medium uppercase tracking-wider">
            Доставка в Ростове
          </span>
          <div className="flex items-center gap-1">
            <MapPin size={14} className="text-orange-500" />
            <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {user?.firstName || 'Гость'}, привет!
            </h1>
          </div>
        </div>
        <button className="p-3 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
          <Bell size={20} />
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
        <input
          type="text"
          placeholder="Поиск блюд, категорий..."
          className="w-full h-14 pl-12 pr-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
        />
      </div>

      {/* Categories Horizontal Scroll */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
        {categories.map(category => (
          <button
            key={category.id}
            type="button"
            onClick={() => onSelectCategory?.(category.id)}
            className="flex flex-col items-center gap-2 min-w-[80px]"
          >
            <div className="w-16 h-16 bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-100 dark:border-zinc-800 flex items-center justify-center p-3">
              <img src={category.image} alt={category.name} className="w-full h-full object-contain" />
            </div>
            <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
              {category.name}
            </span>
          </button>
        ))}
      </div>

      {/* Banners */}
      <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
        {banners.map(banner => (
          <div
            key={banner.id}
            className="min-w-[300px] h-44 bg-zinc-900 rounded-[40px] overflow-hidden relative shadow-xl shadow-zinc-900/10"
          >
            <img src={banner.image} alt={banner.title} className="w-full h-full object-cover opacity-60" />
            <div className="absolute inset-0 p-8 flex flex-col justify-center gap-1">
              <h3 className="text-white text-xl font-black leading-tight max-w-[180px]">
                {banner.title}
              </h3>
              {banner.subtitle && (
                <p className="text-white/70 text-xs font-medium">
                  {banner.subtitle}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Popular Section */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100">Популярное</h2>
          <button className="text-orange-500 text-xs font-bold uppercase tracking-widest">Все</button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {popularProducts.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              isFavorite={user?.favorites.includes(product.id)}
              onFavoriteToggle={() => handleToggleFavorite(product.id)}
              onClick={() => setSelectedProduct(product)}
            />
          ))}
        </div>
      </section>

      {/* New Section */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100">Новинки</h2>
          <button className="text-orange-500 text-xs font-bold uppercase tracking-widest">Все</button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {newProducts.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              isFavorite={user?.favorites.includes(product.id)}
              onFavoriteToggle={() => handleToggleFavorite(product.id)}
              onClick={() => setSelectedProduct(product)}
            />
          ))}
        </div>
      </section>

      <ProductDetailModal 
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        isFavorite={selectedProduct ? user?.favorites.includes(selectedProduct.id) : false}
        onFavoriteToggle={() => selectedProduct && handleToggleFavorite(selectedProduct.id)}
      />
    </div>
  );
};
