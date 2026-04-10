import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Minus, Heart, Info, Flame, Scale, Zap } from 'lucide-react';
import { Product } from '../types';
import { formatPrice, cn } from '../lib/utils';
import { useCart } from '../hooks/useCart';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  isFavorite?: boolean;
  onFavoriteToggle?: (id: string) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  isFavorite,
  onFavoriteToggle
}) => {
  const { items, addItem, updateQuantity } = useCart();
  const cartItem = product ? items.find(item => item.id === product.id) : null;
  const quantity = cartItem?.quantity || 0;
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);

  const handleImageScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const width = e.currentTarget.offsetWidth;
    const index = Math.round(scrollLeft / width);
    setCurrentImageIndex(index);
  };

  return (
    <AnimatePresence>
      {isOpen && product && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-t-[40px] sm:rounded-[40px] overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header Actions */}
            <div className="absolute top-6 left-6 right-6 z-10 flex items-center justify-between pointer-events-none">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="pointer-events-auto w-10 h-10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-2xl flex items-center justify-center text-zinc-900 dark:text-zinc-100 shadow-lg"
              >
                <X size={20} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFavoriteToggle?.(product.id);
                }}
                className="pointer-events-auto w-10 h-10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-2xl flex items-center justify-center text-zinc-400 shadow-lg"
              >
                <Heart 
                  size={20} 
                  fill={isFavorite ? "currentColor" : "none"} 
                  className={cn(isFavorite && "text-red-500")} 
                />
              </button>
            </div>

            {/* Content Section */}
            <div className="flex-1 overflow-y-auto no-scrollbar relative">
              <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                <div 
                  className="flex w-full h-full overflow-x-auto snap-x snap-mandatory no-scrollbar"
                  onScroll={handleImageScroll}
                >
                  {product.images.map((img, idx) => (
                    <div key={idx} className="min-w-full h-full snap-center">
                      <img
                        src={img || 'https://picsum.photos/seed/food/800/600'}
                        alt={`${product.name} ${idx + 1}`}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ))}
                  {product.images.length === 0 && (
                    <div className="min-w-full h-full snap-center">
                      <img
                        src="https://picsum.photos/seed/food/800/600"
                        alt={product.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                </div>

                {/* Pagination Dots */}
                {product.images.length > 1 && (
                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                    {product.images.map((_, idx) => (
                      <div 
                        key={idx}
                        className={cn(
                          "w-2 h-2 rounded-full transition-all duration-300",
                          currentImageIndex === idx ? "bg-white w-4" : "bg-white/40"
                        )}
                      />
                    ))}
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white dark:from-zinc-900 to-transparent" />
              </div>

              <div className="px-8 pb-8 -mt-6 relative z-10">
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      {product.isNew && (
                        <span className="bg-green-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-widest">Новинка</span>
                      )}
                      {product.isPopular && (
                        <span className="bg-orange-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-widest">Хит</span>
                      )}
                    </div>
                    <h2 className="text-3xl font-black text-zinc-900 dark:text-zinc-100 leading-tight">
                      {product.name}
                    </h2>
                    <div className="flex items-center gap-4 text-sm text-zinc-400 font-bold">
                      <span className="flex items-center gap-1.5">
                        <Scale size={14} className="text-orange-500" />
                        {product.weight}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Flame size={14} className="text-orange-500" />
                        {product.kcal} ккал
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Описание</h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
                      {product.description}
                    </p>
                  </div>

                  {/* Nutrition Grid */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-3xl border border-zinc-100 dark:border-zinc-800 flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Белки</span>
                      <span className="text-lg font-black text-zinc-900 dark:text-zinc-100">{product.proteins}г</span>
                    </div>
                    <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-3xl border border-zinc-100 dark:border-zinc-800 flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Жиры</span>
                      <span className="text-lg font-black text-zinc-900 dark:text-zinc-100">{product.fats}г</span>
                    </div>
                    <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-3xl border border-zinc-100 dark:border-zinc-800 flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Углеводы</span>
                      <span className="text-lg font-black text-zinc-900 dark:text-zinc-100">{product.carbs}г</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="relative z-50 p-6 pb-10 sm:pb-6 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between gap-6">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Цена</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
                      {formatPrice(product.price)}
                    </span>
                    {product.oldPrice && (
                      <span className="text-sm text-zinc-400 line-through font-bold">
                        {formatPrice(product.oldPrice)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex-1 flex justify-end">
                  <AnimatePresence mode="wait">
                    {quantity > 0 ? (
                      <motion.div
                        key="quantity-selector"
                        initial={{ opacity: 0, scale: 0.9, x: 20 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9, x: 20 }}
                        className="flex items-center bg-zinc-900 dark:bg-white rounded-2xl p-1 shadow-lg"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (product) updateQuantity(product.id, quantity - 1);
                          }}
                          className="w-12 h-12 flex items-center justify-center text-white dark:text-zinc-900 hover:opacity-70 transition-opacity cursor-pointer"
                        >
                          <Minus size={24} />
                        </button>
                        <span className="w-10 text-center text-white dark:text-zinc-900 font-black text-xl">
                          {quantity}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (product) updateQuantity(product.id, quantity + 1);
                          }}
                          className="w-12 h-12 flex items-center justify-center text-white dark:text-zinc-900 hover:opacity-70 transition-opacity cursor-pointer"
                        >
                          <Plus size={24} />
                        </button>
                      </motion.div>
                    ) : (
                      <motion.button
                        key="add-button"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (product) addItem(product);
                        }}
                        className="w-full h-14 bg-orange-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Plus size={20} /> В корзину
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
