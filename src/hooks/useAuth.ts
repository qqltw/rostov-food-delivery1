import { create } from 'zustand';
import { User } from '../types';
import { apiService } from '../services/apiService';
import { detectPlatform } from '../lib/platform';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  authError: string | null;
  debugInfo: string;
  setUser: (user: User | null) => void;
  init: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAdmin: false,
  authError: null,
  debugInfo: '',
  setUser: (user) => set({ user, isAdmin: user?.role === 'admin' }),
  init: async () => {
    set({ isLoading: true, authError: null });

    const { platform, user: platformUser, debug } = detectPlatform();
    let debugInfo = debug;

    if (!platformUser) {
      debugInfo += '✗ No user data available\n';
      set({ user: null, isAdmin: false, isLoading: false, authError: 'Нет данных пользователя', debugInfo });
      return;
    }

    try {
      const user = await apiService.loginPlatform({
        platform,
        id: platformUser.id,
        first_name: platformUser.first_name,
        last_name: platformUser.last_name,
        username: platformUser.username,
        photo_url: platformUser.photo_url,
      });
      debugInfo += `✓ Auth success [${platform}]: ${user.firstName} (${user.role})\n`;
      set({
        user,
        isAdmin: user.role === 'admin',
        isLoading: false,
        debugInfo,
      });
    } catch (error: any) {
      debugInfo += `✗ Auth error: ${error?.message || error}\n`;
      console.error('Auth error:', error);
      set({
        user: null,
        isAdmin: false,
        isLoading: false,
        authError: error?.message || 'Ошибка авторизации',
        debugInfo,
      });
    }
  },
}));
