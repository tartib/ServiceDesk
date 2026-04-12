'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Plus, Search, Trash2, FolderOpen } from 'lucide-react';
import { useCategories, useCreateCategory, useDeleteCategory } from '@/hooks/useCategories';
import AddCategoryModal from '@/components/categories/AddCategoryModal';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export default function CategoriesPage() {
 const { t } = useLanguage();
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
 <h1 className="text-2xl font-bold text-foreground">{t('categories.title')}</h1>
 <p className="text-muted-foreground mt-1">
 {t('categories.subtitle')}
 </p>
 </div>
 <button 
 onClick={() => setIsAddModalOpen(true)}
 className="inline-flex items-center gap-2 px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand-strong transition-colors"
 >
 <Plus className="w-5 h-5" />
 {t('categories.newCategory')}
 </button>
 </div>

 {/* Search */}
 <div className="bg-card rounded-xl shadow-sm border border-border p-4">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
 <input
 type="text"
 placeholder={t('categories.search')}
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-full pl-10 pr-4 py-2 border border-input rounded-lg bg-card text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
 />
 </div>
 </div>

 {/* Categories Grid */}
 {isLoading ? (
 <div className="flex items-center justify-center py-12">
 <div className="text-center">
 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto"></div>
 <p className="mt-4 text-muted-foreground">{t('categories.messages.loading')}</p>
 </div>
 </div>
 ) : filteredCategories.length === 0 ? (
 <div className="bg-card rounded-xl shadow-sm border border-border p-12">
 <div className="text-center">
 <FolderOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
 <h3 className="text-lg font-semibold text-foreground mb-2">
 {searchQuery ? t('categories.noResults') : t('categories.noCategories')}
 </h3>
 <p className="text-muted-foreground mb-6">
 {searchQuery 
 ? t('categories.noResultsDesc')
 : t('categories.noCategoriesDesc')
 }
 </p>
 {!searchQuery && (
 <button
 onClick={() => setIsAddModalOpen(true)}
 className="inline-flex items-center gap-2 px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand-strong transition-colors"
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
 className="bg-card rounded-xl shadow-sm border border-border p-6 hover:shadow-md transition-shadow"
 >
 <div className="flex items-start justify-between mb-4">
 <div className="flex-1">
 <h3 className="text-lg font-semibold text-foreground">
 {category.name}
 </h3>
 {category.nameAr && (
 <p className="text-sm text-muted-foreground mt-1" dir="rtl">
 {category.nameAr}
 </p>
 )}
 {category.description && (
 <p className="text-sm text-muted-foreground mt-2">
 {category.description}
 </p>
 )}
 </div>
 <div className="flex gap-2 ml-4">
 <button 
 onClick={() => handleDeleteCategory(category.id, category.name)}
 className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive-soft dark:hover:bg-destructive/90/20 rounded-lg transition-colors"
 title="Delete category"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 </div>
 <div className="pt-4 border-t border-border">
 <div className="flex items-center justify-between text-sm">
 <span className="text-muted-foreground">{t('categories.status')}</span>
 <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${
 category.isActive 
 ? 'bg-success-soft text-success dark:text-success'
 : 'bg-muted dark:bg-foreground/80 text-foreground dark:text-muted-foreground'
 }`}>
 <span className={`w-1.5 h-1.5 rounded-full ${category.isActive ? 'bg-success' : 'bg-muted-foreground/70'}`}></span>
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
