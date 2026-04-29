import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: any;
}

export class ErrorBoundary extends Component<Props, State> {
  declare props: Props;

  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: any): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: any, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = 'Что-то пошло не так.';
      let details = '';

      try {
        // Try to parse error JSON if it exists
        const parsed = JSON.parse(this.state.error.message);
        if (parsed.error) {
          errorMessage = `Ошибка: ${parsed.error}`;
          if (parsed.path) details = `Путь: ${parsed.path}`;
        }
      } catch (e) {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-6 text-center">
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[40px] shadow-2xl border border-zinc-100 dark:border-zinc-800 max-w-md w-full flex flex-col gap-6">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <span className="text-4xl font-black">!</span>
            </div>
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100">{errorMessage}</h2>
              {details && <p className="text-xs text-zinc-400 font-mono break-all">{details}</p>}
              <p className="text-sm text-zinc-500">
                Попробуйте обновить страницу или обратитесь в поддержку.
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold"
            >
              Обновить страницу
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
