import React from 'react';
import { motion } from 'motion/react';
import { Home, Grid, ShoppingCart, User } from 'lucide-react';
import { cn } from '../lib/utils';
import { useCart } from '../hooks/useCart';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'home', label: 'Главная', icon: Home },
  { id: 'catalog', label: 'Каталог', icon: Grid },
  { id: 'cart', label: 'Корзина', icon: ShoppingCart },
  { id: 'profile', label: 'Профиль', icon: User },
];

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const cartItemsCount = useCart((state) => state.items.reduce((acc, item) => acc + item.quantity, 0));

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50">
      <div className="bg-white/80 dark:bg-zinc-900/90 backdrop-blur-xl border border-white/20 dark:border-zinc-800/50 rounded-3xl shadow-2xl px-6 py-3 flex items-center justify-between">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "relative flex flex-col items-center gap-1 transition-all duration-300",
                isActive ? "text-orange-500" : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              )}
            >
              <div className="relative">
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                {tab.id === 'cart' && cartItemsCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] font-bold min-w-[16px] h-4 rounded-full flex items-center justify-center px-1"
                  >
                    {cartItemsCount}
                  </motion.span>
                )}
              </div>
              <span className="text-[10px] font-medium">{tab.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -bottom-1 w-1 h-1 bg-orange-500 rounded-full"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
