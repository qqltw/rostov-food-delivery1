import { useEffect, useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { Layout } from './components/Layout';
import { HomePage } from './pages/Home';
import { CatalogPage } from './pages/Catalog';
import { CartPage } from './pages/Cart';
import { ProfilePage } from './pages/Profile';
import { AdminPage } from './pages/Admin';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function App() {
  const { init, isLoading, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('home');

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
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-bold text-zinc-400 uppercase tracking-widest animate-pulse">
            Загрузка Ростова...
          </span>
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
      case 'home': return <HomePage />;
      case 'catalog': return <CatalogPage />;
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
