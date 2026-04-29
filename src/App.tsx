import { useEffect, useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { Layout } from './components/Layout';
import { HomePage } from './pages/Home';
import { CatalogPage } from './pages/Catalog';
import { CartPage } from './pages/Cart';
import { ProfilePage } from './pages/Profile';
import { AdminPage } from './pages/Admin';
import { LoginPage } from './pages/Login';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();
const COMPANY_LOGO_SRC = '/company-logo.png';

export default function App() {
  const { init, isLoading, isAdmin, user, authError, debugInfo, needsLogin } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [catalogCategoryId, setCatalogCategoryId] = useState<string | null>(null);

  useEffect(() => {
    // Apply saved theme on startup
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
    init();
  }, [init]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center justify-center">
          <img
            src={COMPANY_LOGO_SRC}
            alt="Машенькин счастье"
            className="w-56 max-w-[70vw] h-auto object-contain animate-pulse"
          />
        </div>
      </div>
    );
  }

  if (needsLogin && !user) {
    return <LoginPage />;
  }

  if (!user && authError) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full flex flex-col gap-4">
          <h1 className="text-2xl font-black text-red-500">Ошибка авторизации</h1>
          <p className="text-sm text-zinc-700 dark:text-zinc-300">{authError}</p>
          <pre className="text-[10px] bg-zinc-100 dark:bg-zinc-900 p-3 rounded-xl whitespace-pre-wrap text-zinc-700 dark:text-zinc-300 overflow-auto">
            {debugInfo}
          </pre>
          <button
            onClick={() => init()}
            className="bg-orange-500 text-white font-bold py-3 rounded-2xl"
          >
            Повторить
          </button>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    // Special case for admin if user is admin and we want to show it
    if (activeTab === 'profile' && isAdmin) {
      // In a real app, we might have a separate button or route
    }

    switch (activeTab) {
      case 'home': return <HomePage onSelectCategory={(categoryId) => { setCatalogCategoryId(categoryId); setActiveTab('catalog'); }} />;
      case 'catalog': return <CatalogPage initialCategoryId={catalogCategoryId} />;
      case 'cart': return <CartPage />;
      case 'profile': return <ProfilePage />;
      case 'admin': return <AdminPage />;
      default: return <HomePage />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <Layout activeTab={activeTab} onTabChange={setActiveTab}>
        {renderPage()}
        
        {/* Admin quick access */}
        {isAdmin && activeTab !== 'admin' && (
          <div className="fixed bottom-24 left-4 z-[100]">
            <button
              onClick={() => setActiveTab('admin')}
              className="bg-zinc-900/80 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-xl border border-white/10"
            >
              ADMIN
            </button>
          </div>
        )}
      </Layout>
    </QueryClientProvider>
  );
}
