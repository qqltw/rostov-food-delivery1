import { useState, useEffect } from 'react';
import { Product, Category, Banner } from '../types';
import { apiService } from '../services/apiService';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState<string>('connected');

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const [p, c, b, health] = await Promise.all([
          apiService.getProducts(),
          apiService.getCategories(),
          apiService.getBanners(),
          apiService.getHealth().catch(() => ({ status: 'ok', database: 'disconnected' }))
        ]);
        setProducts(p);
        setCategories(c);
        setBanners(b);
        setDbStatus(health.database);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  return { products, categories, banners, isLoading, dbStatus };
}
