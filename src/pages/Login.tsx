import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
  const { loginByPassword, authError, isLoading } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [remember, setRemember] = useState(true);
  const [regError, setRegError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!login.trim() || !password.trim()) return;
    await loginByPassword(login.trim(), password.trim(), remember);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    if (!login.trim() || !password.trim()) return;
    if (password.length < 6) {
      setRegError('Пароль минимум 6 символов');
      return;
    }
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          login: login.trim(),
          password: password.trim(),
          firstName: firstName.trim() || login.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Ошибка регистрации' }));
        setRegError(data.error || 'Ошибка регистрации');
        return;
      }
      // После регистрации — сразу логинимся
      await loginByPassword(login.trim(), password.trim(), remember);
    } catch {
      setRegError('Ошибка соединения');
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center p-6">
      <div className="max-w-sm w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl font-black text-white">R</span>
          </div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white">
            {mode === 'login' ? 'Вход' : 'Регистрация'}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {mode === 'login'
              ? 'Войдите в свой аккаунт'
              : 'Создайте новый аккаунт'}
          </p>
        </div>

        <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="flex flex-col gap-3">
          {mode === 'register' && (
            <input
              type="text"
              placeholder="Имя"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-orange-500"
            />
          )}

          <input
            type="text"
            placeholder="Логин"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            autoComplete="username"
            className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-orange-500"
          />

          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-orange-500"
          />

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="w-4 h-4 rounded accent-orange-500"
            />
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Запомнить меня</span>
          </label>

          {(authError || regError) && (
            <p className="text-red-500 text-sm text-center">{regError || authError}</p>
          )}

          <button
            type="submit"
            disabled={isLoading || !login.trim() || !password.trim()}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors"
          >
            {isLoading ? 'Загрузка...' : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </form>

        <button
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login');
            setRegError('');
          }}
          className="w-full text-center text-sm text-orange-500 font-medium mt-4 py-2"
        >
          {mode === 'login' ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
        </button>
      </div>
    </div>
  );
}
