'use client';

import { useState } from 'react';
import { X, Package, Upload } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { useLanguage } from '@/contexts/LanguageContext';

interface AddInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: {
    name: string;
    nameAr?: string;
    category: string;
    unit: string;
    currentQuantity: number;
    minThreshold: number;
    maxThreshold: number;
    supplier?: string;
    cost?: number;
    imageFile?: File;
  }) => void;
  isLoading?: boolean;
}

const units = [
  { value: 'kg', labelKey: 'inventory.units.kg' },
  { value: 'g', labelKey: 'inventory.units.g' },
  { value: 'l', labelKey: 'inventory.units.l' },
  { value: 'ml', labelKey: 'inventory.units.ml' },
  { value: 'pcs', labelKey: 'inventory.units.pcs' },
  { value: 'cup', labelKey: 'inventory.units.cup' },
  { value: 'tbsp', labelKey: 'inventory.units.tbsp' },
  { value: 'tsp', labelKey: 'inventory.units.tsp' },
];

export default function AddInventoryModal({
  isOpen,
  onClose,
  onAdd,
  isLoading = false,
}: AddInventoryModalProps) {
  const [name, setName] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [category, setCategory] = useState('');
  const [unit, setUnit] = useState('pcs');
  const [currentQuantity, setCurrentQuantity] = useState(0);
  const [minThreshold, setMinThreshold] = useState(5);
  const [maxThreshold, setMaxThreshold] = useState(100);
  const [supplier, setSupplier] = useState('');
  const [cost, setCost] = useState<number | undefined>(undefined);
  const [imageFile, setImageFile] = useState<File | undefined>(undefined);
  const [imagePreview, setImagePreview] = useState<string | undefined>(undefined);

  const { t } = useLanguage();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories(true);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onAdd({
      name,
      nameAr: nameAr || undefined,
      category,
      unit,
      currentQuantity,
      minThreshold,
      maxThreshold,
      supplier: supplier || undefined,
      cost: cost || undefined,
      imageFile,
    });
  };

  const resetForm = () => {
    setName('');
    setNameAr('');
    setCategory('');
    setUnit('pcs');
    setCurrentQuantity(0);
    setMinThreshold(5);
    setMaxThreshold(100);
    setSupplier('');
    setCost(undefined);
    setImageFile(undefined);
    setImagePreview(undefined);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {t('inventory.addModal.title')}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('inventory.addModal.itemImage')}
            </label>
            <div className="flex items-center gap-4">
              {imagePreview ? (
                <div className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-gray-300 dark:border-gray-600">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(undefined);
                      setImagePreview(undefined);
                    }}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                  <Package className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <label className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <Upload className="w-4 h-4" />
                  <span className="text-sm">{t('inventory.addModal.uploadImage')}</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name (English) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('inventory.addModal.nameEn')} *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Name (Arabic) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('inventory.addModal.nameAr')}
              </label>
              <input
                type="text"
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                dir="rtl"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('inventory.addModal.category')} *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={categoriesLoading}
              >
                <option value="">
                  {categoriesLoading ? t('inventory.addModal.loadingCategories') : t('inventory.addModal.selectCategory')}
                </option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name} {cat.nameAr ? `(${cat.nameAr})` : ''}
                  </option>
                ))}
              </select>
              {categories.length === 0 && !categoriesLoading && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  {t('inventory.addModal.noCategories')}
                </p>
              )}
            </div>

            {/* Unit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('inventory.addModal.unit')} *
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {units.map((u) => (
                  <option key={u.value} value={u.value}>
                    {t(u.labelKey)}
                  </option>
                ))}
              </select>
            </div>

            {/* Current Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('inventory.addModal.initialQuantity')} *
              </label>
              <input
                type="number"
                min="0"
                value={currentQuantity}
                onChange={(e) => setCurrentQuantity(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Min Threshold */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('inventory.addModal.minThreshold')} *
              </label>
              <input
                type="number"
                min="0"
                value={minThreshold}
                onChange={(e) => setMinThreshold(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Max Threshold */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('inventory.addModal.maxThreshold')} *
              </label>
              <input
                type="number"
                min="0"
                value={maxThreshold}
                onChange={(e) => setMaxThreshold(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Supplier */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('inventory.addModal.supplier')}
              </label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Supplier name"
              />
            </div>

            {/* Cost */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('inventory.addModal.costPerUnit')}
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={cost || ''}
                onChange={(e) => setCost(e.target.value ? parseFloat(e.target.value) : undefined)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              disabled={isLoading}
            >
              {t('inventory.addModal.cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? t('inventory.addModal.adding') : t('inventory.addModal.addButton')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
