import { create } from 'zustand';
import { User } from '../types';
import { apiService } from '../services/apiService';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  setUser: (user: User | null) => void;
  init: () => Promise<void>;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: any;
    };
  }
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAdmin: false,
  setUser: (user) => set({ user, isAdmin: user?.role === 'admin' }),
  init: async () => {
    set({ isLoading: true });

    const tg = window.Telegram?.WebApp;

    if (tg) {
      // Signal to Telegram that the app is ready
      tg.ready();
      // Expand the app to full height
      tg.expand();
    }

    const tgUser = tg?.initDataUnsafe?.user;

    if (tgUser) {
      try {
        const user = await apiService.loginTelegram({
          id: tgUser.id,
          first_name: tgUser.first_name,
          last_name: tgUser.last_name,
          username: tgUser.username,
          photo_url: tgUser.photo_url,
        });
        set({ user, isAdmin: user.role === 'admin', isLoading: false });
      } catch (error) {
        console.error('Auth error:', error);
        set({ user: null, isAdmin: false, isLoading: false });
      }
    } else {
      // Not inside Telegram — no user session
      set({ user: null, isAdmin: false, isLoading: false });
    }
  },
}));
