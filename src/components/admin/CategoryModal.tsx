import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Category } from '../../types';
import { Button } from '../Button';
import { motion, AnimatePresence } from 'motion/react';
import { generateSlug } from '../../lib/utils';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: any) => void;
  category?: Category | null;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({ isOpen, onClose, onSave, category }) => {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    image: '',
    sortOrder: 0,
    isVisible: true,
  });

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        slug: category.slug,
        image: category.image || '',
        sortOrder: category.sortOrder,
        isVisible: category.isVisible !== false,
      });
    } else {
      setFormData({
        name: '',
        slug: '',
        image: '',
        sortOrder: 0,
        isVisible: true,
      });
    }
  }, [category, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      slug: formData.slug || generateSlug(formData.name),
    });
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: prev.slug || generateSlug(name),
    }));
  };

  const inputClass = "px-4 py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border-none outline-none font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 w-full";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="bg-white dark:bg-zinc-900 rounded-t-[32px] sm:rounded-[32px] w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] relative z-10"
          >
            <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800">
              <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100">{category ? 'Редактировать категорию' : 'Новая категория'}</h2>
              <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <form id="category-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Название *</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={e => handleNameChange(e.target.value)}
                    placeholder="Бургеры"
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Slug (URL)</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={e => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="burgers"
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase">URL картинки</label>
                  <input
                    type="text"
                    value={formData.image}
                    onChange={e => setFormData({ ...formData, image: e.target.value })}
                    placeholder="https://..."
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Порядок сортировки</label>
                  <input
                    required
                    type="number"
                    value={formData.sortOrder}
                    onChange={e => setFormData({ ...formData, sortOrder: Number(e.target.value) })}
                    className={inputClass}
                  />
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isVisible}
                    onChange={e => setFormData({ ...formData, isVisible: e.target.checked })}
                    className="w-5 h-5 rounded-md accent-orange-500"
                  />
                  <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">Видна в каталоге</span>
                </label>
              </form>
            </div>
            <div className="p-6 pb-10 sm:pb-6 border-t border-zinc-100 dark:border-zinc-800">
              <Button type="submit" form="category-form" className="w-full">Сохранить</Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
