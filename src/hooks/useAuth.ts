import { create } from 'zustand';
import { User, ADMIN_ROLES, ROLE_MANAGER_ROLES, UserRole } from '../types';
import { apiService } from '../services/apiService';
import { detectPlatform } from '../lib/platform';

function hasAdminAccess(role?: UserRole): boolean {
  return !!role && ADMIN_ROLES.includes(role);
}

function canManageRoles(role?: UserRole): boolean {
  return !!role && ROLE_MANAGER_ROLES.includes(role);
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  canManageRoles: boolean;
  authError: string | null;
  debugInfo: string;
  needsLogin: boolean;
  setUser: (user: User | null) => void;
  init: () => Promise<void>;
  loginByPassword: (login: string, password: string, remember?: boolean) => Promise<void>;
  logout: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAdmin: false,
  canManageRoles: false,
  authError: null,
  debugInfo: '',
  needsLogin: false,
  setUser: (user) => set({ user, isAdmin: hasAdminAccess(user?.role), canManageRoles: canManageRoles(user?.role) }),

  init: async () => {
    set({ isLoading: true, authError: null, needsLogin: false });

    const { platform, user: platformUser, debug } = detectPlatform();
    let debugInfo = debug;

    // Браузер — проверяем сохранённую сессию, иначе показываем форму входа
    if (platform === 'browser') {
      const saved = localStorage.getItem('auth_credentials');
      if (saved) {
        try {
          const { login, password } = JSON.parse(saved);
          const user = await apiService.loginPassword(login, password);
          debugInfo += `✓ Restored session [browser]: ${user.firstName} (${user.role})\n`;
          set({ user, isAdmin: hasAdminAccess(user.role), canManageRoles: canManageRoles(user.role), isLoading: false, debugInfo });
          return;
        } catch {
          localStorage.removeItem('auth_credentials');
          debugInfo += '✗ Saved session expired, login required\n';
        }
      }
      debugInfo += '→ Browser detected, login required\n';
      set({ user: null, isAdmin: false, isLoading: false, needsLogin: true, debugInfo });
      return;
    }

    if (!platformUser) {
      debugInfo += '✗ No user data from messenger\n';
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
        isAdmin: hasAdminAccess(user.role),
        canManageRoles: canManageRoles(user.role),
        isLoading: false,
        debugInfo,
      });
    } catch (error: any) {
      debugInfo += `✗ Auth error: ${error?.message || error}\n`;
      console.error('Auth error:', error);
      set({
        user: null,
        isAdmin: false,
        canManageRoles: false,
        isLoading: false,
        authError: error?.message || 'Ошибка авторизации',
        debugInfo,
      });
    }
  },

  loginByPassword: async (login: string, password: string, remember = false) => {
    set({ isLoading: true, authError: null });
    try {
      const user = await apiService.loginPassword(login, password);
      if (remember) {
        localStorage.setItem('auth_credentials', JSON.stringify({ login, password }));
      }
      set({
        user,
        isAdmin: hasAdminAccess(user.role),
        canManageRoles: canManageRoles(user.role),
        isLoading: false,
        needsLogin: false,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        authError: error?.message || 'Неверный логин или пароль',
      });
    }
  },

  logout: () => {
    localStorage.removeItem('auth_credentials');
    set({ user: null, isAdmin: false, canManageRoles: false, needsLogin: true, authError: null });
  },
}));
