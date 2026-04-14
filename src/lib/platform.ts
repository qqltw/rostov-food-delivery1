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
  platform: Platform | 'browser';
  webapp: any;
  user: PlatformUser | null;
  debug: string;
}

/**
 * Определяет платформу и извлекает данные пользователя.
 * Приоритет: Telegram > MAX > browser (требуется логин/пароль)
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
  const maxWebApp = window.WebApp;
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

  // 3. Обычный браузер — нужен вход по логину/паролю
  debug += `→ Browser mode: login required\n`;
  return {
    platform: 'browser',
    webapp: null,
    user: null,
    debug,
  };
}
