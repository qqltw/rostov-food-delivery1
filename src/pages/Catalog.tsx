import React, { useState, useMemo } from 'react';
import { Search, ChevronRight } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { ProductCard } from '../components/ProductCard';
import { ProductDetailModal } from '../components/ProductDetailModal';
import { cn } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';
import { Product } from '../types';

interface CatalogPageProps {
  initialCategoryId?: string | null;
}

export const CatalogPage: React.FC<CatalogPageProps> = ({ initialCategoryId = null }) => {
  const { products, categories, isLoading, dbStatus } = useProducts();
  const { user, setUser } = useAuth();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  React.useEffect(() => {
    setSelectedCategoryId(initialCategoryId);
  }, [initialCategoryId]);

  const handleToggleFavorite = async (productId: string) => {
    if (!user) return;
    try {
      const updatedUser = await apiService.toggleFavorite(user.id, productId);
      setUser(updatedUser);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const filteredProducts = useMemo(() => {
    // ... same as before
    const query = searchQuery.toLowerCase().trim();
    if (!query && !selectedCategoryId) return products;

    return products.filter(product => {
      const matchesCategory = selectedCategoryId ? product.categoryId === selectedCategoryId : true;
      
      if (!query) return matchesCategory;

      const words = query.split(/\s+/);
      const targetText = `${product.name} ${product.description} ${product.tags.join(' ')}`.toLowerCase();
      
      const matchesSearch = words.every(word => {
        if (targetText.includes(word)) return true;
        if (word.length >= 3) {
          return targetText.split(/\s+/).some(targetWord => {
            if (targetWord.length < 3) return false;
            return targetWord.startsWith(word.slice(0, -1)) || word.startsWith(targetWord.slice(0, -1));
          });
        }
        return false;
      });

      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategoryId, searchQuery]);

  if (isLoading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded-2xl w-full" />
      <div className="h-20 bg-zinc-200 dark:bg-zinc-800 rounded-2xl w-full" />
      <div className="grid grid-cols-2 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="aspect-square bg-zinc-200 dark:bg-zinc-800 rounded-3xl" />)}
      </div>
    </div>;
  }

  return (
    <div className="flex flex-col gap-6">
      {dbStatus.includes('disconnected') && (
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-3xl flex flex-col gap-2">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <span className="text-sm font-bold">Демо-режим (База данных не подключена)</span>
          </div>
          <p className="text-xs text-amber-600/80 dark:text-amber-400/80 leading-relaxed">
            Для полноценной работы приложения (сохранение заказов, профиля и избранного) необходимо добавить <b>DATABASE_URL</b> в настройки (Secrets). Сейчас используются демонстрационные данные.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">Каталог</h1>
        <p className="text-sm text-zinc-400 font-medium">Выберите категорию или найдите блюдо</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Что вы ищете?"
          className="w-full h-14 pl-12 pr-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
        />
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setSelectedCategoryId(null)}
          className={cn(
            "p-4 rounded-3xl border transition-all flex items-center justify-between",
            !selectedCategoryId 
              ? "bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20" 
              : "bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
          )}
        >
          <span className="text-sm font-bold">Все блюда</span>
          <ChevronRight size={16} />
        </button>
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setSelectedCategoryId(category.id)}
            className={cn(
              "p-4 rounded-3xl border transition-all flex items-center justify-between",
              selectedCategoryId === category.id
                ? "bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20"
                : "bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
            )}
          >
            <span className="text-sm font-bold">{category.name}</span>
            <ChevronRight size={16} />
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100">
            {selectedCategoryId ? categories.find(c => c.id === selectedCategoryId)?.name : 'Все блюда'}
          </h2>
          <span className="text-xs text-zinc-400 font-bold uppercase tracking-widest">
            {filteredProducts.length} позиций
          </span>
        </div>
        
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {filteredProducts.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                isFavorite={user?.favorites.includes(product.id)}
                onFavoriteToggle={() => handleToggleFavorite(product.id)}
                onClick={() => setSelectedProduct(product)}
              />
            ))}
          </div>
        ) : (
          <div className="py-20 flex flex-col items-center justify-center text-center gap-4">
            <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400">
              <Search size={40} />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Ничего не найдено</h3>
              <p className="text-sm text-zinc-400">Попробуйте изменить запрос или категорию</p>
            </div>
          </div>
        )}
      </div>

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
