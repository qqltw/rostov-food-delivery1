import { Platform } from '../types';

// Расширяем Window для обеих платформ
declare global {
  interface Window {
    Telegram?: {
      WebApp: any;
    };
    WebApp?: any; // MAX Bridge global object
  }
}

export interface PlatformUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

export interface PlatformInfo {
  platform: Platform;
  webapp: any;
  user: PlatformUser | null;
  debug: string;
}

// Fallback Telegram ID for browser testing (admin ID)
const DEV_FALLBACK_TG_ID = 1114947252;

/**
 * Определяет платформу и извлекает данные пользователя.
 * Приоритет: Telegram > MAX > Dev fallback
 */
export function detectPlatform(): PlatformInfo {
  let debug = '';

  // 1. Проверяем Telegram
  const tgWebApp = window.Telegram?.WebApp;
  debug += `Telegram.WebApp exists: ${!!tgWebApp}\n`;

  if (tgWebApp) {
    try {
      tgWebApp.ready();
      tgWebApp.expand();
      debug += `platform: telegram\n`;
      debug += `tg.platform: ${tgWebApp.platform}\n`;
      debug += `tg.version: ${tgWebApp.version}\n`;
      debug += `initData length: ${tgWebApp.initData?.length || 0}\n`;
    } catch (e) {
      debug += `tg.ready/expand error: ${e}\n`;
    }

    const tgUser = tgWebApp.initDataUnsafe?.user;
    debug += `tg initDataUnsafe.user: ${tgUser ? JSON.stringify(tgUser) : 'null'}\n`;

    if (tgUser) {
      return { platform: 'telegram', webapp: tgWebApp, user: tgUser, debug };
    }
  }

  // 2. Проверяем MAX (window.WebApp — глобальный объект MAX Bridge)
  // MAX Bridge устанавливает window.WebApp напрямую (не через window.Telegram)
  const maxWebApp = window.WebApp;
  // Отличаем MAX WebApp от случайного объекта: у MAX есть initDataUnsafe
  const isMaxWebApp = maxWebApp && !window.Telegram?.WebApp?.initDataUnsafe?.user && maxWebApp.initDataUnsafe;
  debug += `MAX WebApp exists: ${!!isMaxWebApp}\n`;

  if (isMaxWebApp) {
    debug += `platform: max\n`;
    debug += `max.platform: ${maxWebApp.platform}\n`;
    debug += `max.version: ${maxWebApp.version}\n`;
    debug += `initData length: ${maxWebApp.initData?.length || 0}\n`;

    const maxUser = maxWebApp.initDataUnsafe?.user;
    debug += `max initDataUnsafe.user: ${maxUser ? JSON.stringify(maxUser) : 'null'}\n`;

    if (maxUser) {
      return { platform: 'max', webapp: maxWebApp, user: maxUser, debug };
    }
  }

  // 3. Dev fallback — вне мессенджеров (для разработки)
  debug += `→ Using DEV fallback user (telegram, id=${DEV_FALLBACK_TG_ID})\n`;
  return {
    platform: 'telegram',
    webapp: tgWebApp || null,
    user: {
      id: DEV_FALLBACK_TG_ID,
      first_name: 'Dev',
      last_name: 'User',
      username: 'devuser',
    },
    debug,
  };
}
