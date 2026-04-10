import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '../types';

interface CartItem extends Product {
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalAmount: number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      totalAmount: 0,
      addItem: (product) => {
        const items = get().items;
        const existingItem = items.find((i) => i.id === product.id);
        
        let newItems;
        if (existingItem) {
          newItems = items.map((i) =>
            i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
          );
        } else {
          newItems = [...items, { ...product, quantity: 1 }];
        }
        
        const totalAmount = newItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
        set({ items: newItems, totalAmount });
      },
      removeItem: (productId) => {
        const newItems = get().items.filter((i) => i.id !== productId);
        const totalAmount = newItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
        set({ items: newItems, totalAmount });
      },
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        const newItems = get().items.map((i) =>
          i.id === productId ? { ...i, quantity } : i
        );
        const totalAmount = newItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
        set({ items: newItems, totalAmount });
      },
      clearCart: () => set({ items: [], totalAmount: 0 }),
    }),
    {
      name: 'cart-storage',
    }
  )
);
