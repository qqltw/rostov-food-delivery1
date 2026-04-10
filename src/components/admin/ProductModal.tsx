import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Product, Category } from '../../types';
import { Button } from '../Button';
import { motion, AnimatePresence } from 'motion/react';
import { generateSlug } from '../../lib/utils';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: any) => void;
  product?: Product | null;
  categories: Category[];
}

export const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, onSave, product, categories }) => {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: 0,
    oldPrice: null as number | null,
    categoryId: '',
    images: [''],
    weight: '',
    kcal: 0,
    proteins: 0,
    fats: 0,
    carbs: 0,
    tags: [] as string[],
    isPopular: false,
    isNew: false,
    isAvailable: true,
    sortOrder: 0,
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        slug: product.slug,
        description: product.description || '',
        price: product.price,
        oldPrice: product.oldPrice || null,
        categoryId: product.categoryId,
        images: product.images.length ? [...product.images] : [''],
        weight: product.weight || '',
        kcal: product.kcal || 0,
        proteins: product.proteins || 0,
        fats: product.fats || 0,
        carbs: product.carbs || 0,
        tags: product.tags || [],
        isPopular: product.isPopular,
        isNew: product.isNew,
        isAvailable: product.isAvailable,
        sortOrder: product.sortOrder || 0,
      });
    } else {
      setFormData({
        name: '',
        slug: '',
        description: '',
        price: 0,
        oldPrice: null,
        categoryId: categories[0]?.id || '',
        images: [''],
        weight: '',
        kcal: 0,
        proteins: 0,
        fats: 0,
        carbs: 0,
        tags: [],
        isPopular: false,
        isNew: false,
        isAvailable: true,
        sortOrder: 0,
      });
    }
    setTagInput('');
  }, [product, categories, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      slug: formData.slug || generateSlug(formData.name),
      images: formData.images.filter(img => img.trim() !== ''),
      oldPrice: formData.oldPrice || undefined,
    };
    onSave(data);
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: prev.slug || generateSlug(name),
    }));
  };

  const addImage = () => {
    setFormData(prev => ({ ...prev, images: [...prev.images, ''] }));
  };

  const removeImage = (idx: number) => {
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
  };

  const updateImage = (idx: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.map((img, i) => i === idx ? value : img),
    }));
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
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
              <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100">{product ? 'Редактировать товар' : 'Новый товар'}</h2>
              <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <form id="product-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Name */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Название *</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={e => handleNameChange(e.target.value)}
                    placeholder="Бургер Классический"
                    className={inputClass}
                  />
                </div>

                {/* Slug */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Slug (URL)</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={e => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="burger-classic"
                    className={inputClass}
                  />
                </div>

                {/* Description */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Описание</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Описание блюда..."
                    className={`${inputClass} resize-none h-24`}
                  />
                </div>

                {/* Price & Old Price */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Цена (₽) *</label>
                    <input
                      required
                      type="number"
                      min={0}
                      value={formData.price}
                      onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                      className={inputClass}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Старая цена</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.oldPrice || ''}
                      onChange={e => setFormData({ ...formData, oldPrice: e.target.value ? Number(e.target.value) : null })}
                      placeholder="—"
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Category */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Категория *</label>
                  <select
                    required
                    value={formData.categoryId}
                    onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                    className={inputClass}
                  >
                    <option value="">Выберите категорию</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Weight & Nutrition */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Вес</label>
                  <input
                    type="text"
                    value={formData.weight}
                    onChange={e => setFormData({ ...formData, weight: e.target.value })}
                    placeholder="350г"
                    className={inputClass}
                  />
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Ккал</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.kcal}
                      onChange={e => setFormData({ ...formData, kcal: Number(e.target.value) })}
                      className={inputClass}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Белки</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.proteins}
                      onChange={e => setFormData({ ...formData, proteins: Number(e.target.value) })}
                      className={inputClass}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Жиры</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.fats}
                      onChange={e => setFormData({ ...formData, fats: Number(e.target.value) })}
                      className={inputClass}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Углеводы</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.carbs}
                      onChange={e => setFormData({ ...formData, carbs: Number(e.target.value) })}
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Images */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Картинки</label>
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        value={img}
                        onChange={e => updateImage(idx, e.target.value)}
                        placeholder="https://..."
                        className={inputClass}
                      />
                      {formData.images.length > 1 && (
                        <button type="button" onClick={() => removeImage(idx)} className="text-zinc-400 hover:text-red-500 p-2">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={addImage} className="text-orange-500 text-xs font-bold flex items-center gap-1 self-start">
                    <Plus size={14} /> Добавить картинку
                  </button>
                </div>

                {/* Tags */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Теги</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                      placeholder="мясо, сытно..."
                      className={inputClass}
                    />
                    <button type="button" onClick={addTag} className="px-3 py-2 bg-orange-500 text-white rounded-2xl text-xs font-bold">
                      +
                    </button>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map(tag => (
                        <span key={tag} className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold px-3 py-1.5 rounded-full">
                          {tag}
                          <button type="button" onClick={() => removeTag(tag)} className="text-zinc-400 hover:text-red-500">
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sort Order */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Порядок сортировки</label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={e => setFormData({ ...formData, sortOrder: Number(e.target.value) })}
                    className={inputClass}
                  />
                </div>

                {/* Toggles */}
                <div className="flex flex-col gap-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isAvailable}
                      onChange={e => setFormData({ ...formData, isAvailable: e.target.checked })}
                      className="w-5 h-5 rounded-md accent-orange-500"
                    />
                    <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">В наличии</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isPopular}
                      onChange={e => setFormData({ ...formData, isPopular: e.target.checked })}
                      className="w-5 h-5 rounded-md accent-orange-500"
                    />
                    <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">Популярное</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isNew}
                      onChange={e => setFormData({ ...formData, isNew: e.target.checked })}
                      className="w-5 h-5 rounded-md accent-orange-500"
                    />
                    <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">Новинка</span>
                  </label>
                </div>
              </form>
            </div>
            <div className="p-6 pb-10 sm:pb-6 border-t border-zinc-100 dark:border-zinc-800">
              <Button type="submit" form="product-form" className="w-full">Сохранить</Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
