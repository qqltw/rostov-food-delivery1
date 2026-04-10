import { create } from 'zustand';
import { User } from '../types';
import { apiService } from '../services/apiService';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  authError: string | null;
  debugInfo: string;
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

// Fallback Telegram ID for browser testing (your admin ID)
const DEV_FALLBACK_TG_ID = 1114947252;

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAdmin: false,
  authError: null,
  debugInfo: '',
  setUser: (user) => set({ user, isAdmin: user?.role === 'admin' }),
  init: async () => {
    set({ isLoading: true, authError: null });

    const tg = window.Telegram?.WebApp;
    let debug = '';
    debug += `window.Telegram exists: ${!!window.Telegram}\n`;
    debug += `WebApp exists: ${!!tg}\n`;

    if (tg) {
      try {
        tg.ready();
        tg.expand();
        debug += `platform: ${tg.platform}\n`;
        debug += `version: ${tg.version}\n`;
        debug += `initData length: ${tg.initData?.length || 0}\n`;
      } catch (e) {
        debug += `tg.ready/expand error: ${e}\n`;
      }
    }

    let tgUser = tg?.initDataUnsafe?.user;
    debug += `initDataUnsafe.user: ${tgUser ? JSON.stringify(tgUser) : 'null'}\n`;

    // Dev fallback: when opened outside Telegram (e.g. plain browser for testing)
    if (!tgUser) {
      debug += `→ Using DEV fallback user (id=${DEV_FALLBACK_TG_ID})\n`;
      tgUser = {
        id: DEV_FALLBACK_TG_ID,
        first_name: 'Dev',
        last_name: 'User',
        username: 'devuser',
      };
    }

    try {
      const user = await apiService.loginTelegram({
        id: tgUser.id,
        first_name: tgUser.first_name,
        last_name: tgUser.last_name,
        username: tgUser.username,
        photo_url: tgUser.photo_url,
      });
      debug += `✓ Auth success: ${user.firstName} (${user.role})\n`;
      set({
        user,
        isAdmin: user.role === 'admin',
        isLoading: false,
        debugInfo: debug,
      });
    } catch (error: any) {
      debug += `✗ Auth error: ${error?.message || error}\n`;
      console.error('Auth error:', error);
      set({
        user: null,
        isAdmin: false,
        isLoading: false,
        authError: error?.message || 'Ошибка авторизации',
        debugInfo: debug,
      });
    }
  },
}));
