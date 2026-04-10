import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Minus, Heart } from 'lucide-react';
import { Product } from '../types';
import { formatPrice, cn } from '../lib/utils';
import { useCart } from '../hooks/useCart';

interface ProductCardProps {
  product: Product;
  onFavoriteToggle?: (id: string) => void;
  isFavorite?: boolean;
  onClick?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onFavoriteToggle, isFavorite, onClick }) => {
  const { items, addItem, updateQuantity } = useCart();
  const cartItem = items.find((i) => i.id === product.id);
  const quantity = cartItem?.quantity || 0;
  
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);

  const handleImageScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const width = e.currentTarget.offsetWidth;
    const index = Math.round(scrollLeft / width);
    setCurrentImageIndex(index);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className="bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-sm border border-zinc-100 dark:border-zinc-800 flex flex-col cursor-pointer select-none active:bg-zinc-50 dark:active:bg-zinc-800/50 transition-colors"
    >
      <div className="relative aspect-square overflow-hidden bg-zinc-50 dark:bg-zinc-800 group">
        {/* Image Carousel */}
        <div 
          className="flex w-full h-full overflow-x-auto snap-x snap-mandatory no-scrollbar"
          onScroll={handleImageScroll}
        >
          {product.images.map((img, idx) => (
            <div key={idx} className="min-w-full h-full snap-center">
              <img
                src={img || 'https://picsum.photos/seed/food/400/400'}
                alt={`${product.name} ${idx + 1}`}
                className="w-full h-full object-cover pointer-events-none"
                referrerPolicy="no-referrer"
              />
            </div>
          ))}
          {product.images.length === 0 && (
            <div className="min-w-full h-full snap-center">
              <img
                src="https://picsum.photos/seed/food/400/400"
                alt={product.name}
                className="w-full h-full object-cover pointer-events-none"
                referrerPolicy="no-referrer"
              />
            </div>
          )}
        </div>

        {/* Pagination Dots */}
        {product.images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-10">
            {product.images.map((_, idx) => (
              <div 
                key={idx}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all duration-300",
                  currentImageIndex === idx ? "bg-white w-3" : "bg-white/40"
                )}
              />
            ))}
          </div>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            onFavoriteToggle?.(product.id);
          }}
          className="absolute top-3 right-3 p-2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-full text-zinc-400 hover:text-red-500 transition-colors z-20"
        >
          <Heart size={18} fill={isFavorite ? "currentColor" : "none"} className={cn(isFavorite && "text-red-500")} />
        </button>
        {(product.isNew || product.isPopular) && (
          <div className="absolute top-3 left-3 flex flex-col gap-1 z-20">
            {product.isNew && (
              <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                Новинка
              </span>
            )}
            {product.isPopular && (
              <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                Хит
              </span>
            )}
          </div>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col gap-2 bg-white dark:bg-zinc-900">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-1">
            {product.name}
          </h3>
          <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-medium">
            <span>{product.weight}</span>
            <span>•</span>
            <span>{product.kcal} ккал</span>
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex flex-col bg-zinc-50 dark:bg-zinc-800 px-3 py-1.5 rounded-2xl border border-zinc-100 dark:border-zinc-800">
              {product.oldPrice && (
                <span className="text-[10px] text-zinc-400 line-through leading-none mb-0.5">
                  {formatPrice(product.oldPrice)}
                </span>
              )}
              <span className="text-sm font-black text-zinc-900 dark:text-zinc-100 leading-none">
                {formatPrice(product.price)}
              </span>
            </div>
            
            <AnimatePresence mode="wait">
              {quantity === 0 ? (
                <motion.button
                  key="add-button"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    addItem(product);
                  }}
                  className="p-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl hover:opacity-90 active:scale-95 transition-all shadow-sm"
                >
                  <Plus size={20} />
                </motion.button>
              ) : null}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {quantity > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0, marginTop: 0 }}
                animate={{ height: 'auto', opacity: 1, marginTop: 4 }}
                exit={{ height: 0, opacity: 0, marginTop: 0 }}
                className="overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between bg-zinc-900 dark:bg-white rounded-2xl p-1 shadow-lg">
                  <button
                    onClick={() => updateQuantity(product.id, quantity - 1)}
                    className="w-10 h-10 flex items-center justify-center text-white dark:text-zinc-900 hover:opacity-70 transition-opacity"
                  >
                    <Minus size={20} />
                  </button>
                  <span className="flex-1 text-center text-white dark:text-zinc-900 font-black text-lg">
                    {quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(product.id, quantity + 1)}
                    className="w-10 h-10 flex items-center justify-center text-white dark:text-zinc-900 hover:opacity-70 transition-opacity"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};
