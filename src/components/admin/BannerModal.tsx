import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Banner } from '../../types';
import { Button } from '../Button';
import { motion, AnimatePresence } from 'motion/react';

interface BannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (banner: any) => void;
  banner?: Banner | null;
}

export const BannerModal: React.FC<BannerModalProps> = ({ isOpen, onClose, onSave, banner }) => {
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    image: '',
    link: '',
    isActive: true,
    sortOrder: 0,
  });

  useEffect(() => {
    if (banner) {
      setFormData({
        title: banner.title,
        subtitle: banner.subtitle || '',
        image: banner.image || '',
        link: banner.link || '',
        isActive: banner.isActive !== false,
        sortOrder: banner.sortOrder || 0,
      });
    } else {
      setFormData({
        title: '',
        subtitle: '',
        image: '',
        link: '',
        isActive: true,
        sortOrder: 0,
      });
    }
  }, [banner, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
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
              <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100">{banner ? 'Редактировать баннер' : 'Новый баннер'}</h2>
              <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <form id="banner-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Заголовок *</label>
                  <input
                    required
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Скидка 20% на первый заказ"
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Подзаголовок</label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                    placeholder="Промокод ROSTOV20"
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase">URL картинки *</label>
                  <input
                    required
                    type="text"
                    value={formData.image}
                    onChange={e => setFormData({ ...formData, image: e.target.value })}
                    placeholder="https://..."
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Ссылка</label>
                  <input
                    type="text"
                    value={formData.link}
                    onChange={e => setFormData({ ...formData, link: e.target.value })}
                    placeholder="https://..."
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Порядок сортировки</label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={e => setFormData({ ...formData, sortOrder: Number(e.target.value) })}
                    className={inputClass}
                  />
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-5 h-5 rounded-md accent-orange-500"
                  />
                  <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">Активен</span>
                </label>
              </form>
            </div>
            <div className="p-6 pb-10 sm:pb-6 border-t border-zinc-100 dark:border-zinc-800">
              <Button type="submit" form="banner-form" className="w-full">Сохранить</Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
