'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Plus, Search, Trash2, FolderOpen } from 'lucide-react';
import { useCategories, useCreateCategory, useDeleteCategory } from '@/hooks/useCategories';
import AddCategoryModal from '@/components/categories/AddCategoryModal';
import { useToast } from '@/components/ui/Toast';
import { useLanguage } from '@/contexts/LanguageContext';

export default function CategoriesPage() {
  const { t } = useLanguage();
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const { data: categories = [], isLoading } = useCategories(true);
  const createCategoryMutation = useCreateCategory();
  const deleteCategoryMutation = useDeleteCategory();

  const filteredCategories = categories.filter((category) =>
    category.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.nameAr?.includes(searchQuery) ||
    category.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddCategory = async (data: {
    name: string;
    nameAr?: string;
    description?: string;
  }) => {
    try {
      await createCategoryMutation.mutateAsync(data);
      toast.success(t('categories.messages.categoryAdded'));
      setIsAddModalOpen(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('categories.messages.categoryAddFailed');
      toast.error(errorMessage);
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`${t('categories.messages.confirmDelete')} "${name}"?`)) {
      return;
    }

    try {
      await deleteCategoryMutation.mutateAsync(id);
      toast.success(t('categories.messages.categoryDeleted'));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('categories.messages.categoryDeleteFailed');
      toast.error(errorMessage);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('categories.title')}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {t('categories.subtitle')}
            </p>
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            {t('categories.newCategory')}
          </button>
        </div>

        {/* Search */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('categories.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Categories Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-500 dark:text-gray-400">{t('categories.messages.loading')}</p>
            </div>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12">
            <div className="text-center">
              <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {searchQuery ? t('categories.noResults') : t('categories.noCategories')}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {searchQuery 
                  ? t('categories.noResultsDesc')
                  : t('categories.noCategoriesDesc')
                }
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  {t('categories.createCategory')}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCategories.map((category) => (
              <div
                key={category.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {category.name}
                    </h3>
                    {category.nameAr && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1" dir="rtl">
                        {category.nameAr}
                      </p>
                    )}
                    {category.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        {category.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button 
                      onClick={() => handleDeleteCategory(category.id, category.name)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Delete category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">{t('categories.status')}</span>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${
                      category.isActive 
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${category.isActive ? 'bg-green-600' : 'bg-gray-600'}`}></span>
                      {category.isActive ? t('categories.active') : t('categories.inactive')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <AddCategoryModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddCategory}
          isLoading={createCategoryMutation.isPending}
        />
      </div>
    </DashboardLayout>
  );
}
