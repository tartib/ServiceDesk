'use client';

import { useState } from 'react';
import { X, FolderPlus } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface AddCategoryModalProps {
 isOpen: boolean;
 onClose: () => void;
 onAdd: (data: {
 name: string;
 nameAr?: string;
 description?: string;
 }) => void;
 isLoading?: boolean;
}

export default function AddCategoryModal({
 isOpen,
 onClose,
 onAdd,
 isLoading = false,
}: AddCategoryModalProps) {
 const { t } = useLanguage();
 const [name, setName] = useState('');
 const [nameAr, setNameAr] = useState('');
 const [description, setDescription] = useState('');

 if (!isOpen) return null;

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 
 onAdd({
 name,
 nameAr: nameAr || undefined,
 description: description || undefined,
 });
 };

 const resetForm = () => {
 setName('');
 setNameAr('');
 setDescription('');
 };

 const handleClose = () => {
 resetForm();
 onClose();
 };

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
 <div className="bg-background dark:bg-foreground/90 rounded-xl shadow-2xl w-full max-w-md mx-4">
 <div className="flex items-center justify-between p-6 border-b border-border dark:border-border">
 <h2 className="text-xl font-bold text-foreground dark:text-white">
 {t('categories.addModal.title')}
 </h2>
 <button
 onClick={handleClose}
 className="text-muted-foreground hover:text-muted-foreground dark:hover:text-muted-foreground"
 >
 <X className="w-6 h-6" />
 </button>
 </div>

 <form onSubmit={handleSubmit} className="p-6 space-y-4">
 <div>
 <label className="block text-sm font-medium text-foreground dark:text-muted-foreground mb-2">
 {t('categories.addModal.nameEn')} *
 </label>
 <input
 type="text"
 value={name}
 onChange={(e) => setName(e.target.value)}
 className="w-full px-4 py-2 border border-border dark:border-border rounded-lg bg-background dark:bg-foreground/80 text-foreground dark:text-background focus:ring-2 focus:ring-ring focus:border-transparent"
 placeholder="e.g., Hardware"
 required
 maxLength={50}
 />
 </div>

 <div>
 <label className="block text-sm font-medium text-foreground dark:text-muted-foreground mb-2">
 {t('categories.addModal.nameAr')}
 </label>
 <input
 type="text"
 value={nameAr}
 onChange={(e) => setNameAr(e.target.value)}
 className="w-full px-4 py-2 border border-border dark:border-border rounded-lg bg-background dark:bg-foreground/80 text-foreground dark:text-background focus:ring-2 focus:ring-ring focus:border-transparent"
 placeholder="مثال: أجهزة"
 dir="rtl"
 maxLength={50}
 />
 </div>

 <div>
 <label className="block text-sm font-medium text-foreground dark:text-muted-foreground mb-2">
 {t('categories.addModal.description')}
 </label>
 <textarea
 value={description}
 onChange={(e) => setDescription(e.target.value)}
 rows={3}
 className="w-full px-4 py-2 border border-border dark:border-border rounded-lg bg-background dark:bg-foreground/80 text-foreground dark:text-background focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
 placeholder={t('categories.addModal.descriptionPlaceholder')}
 maxLength={200}
 />
 <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">
 {description.length}/200 {t('categories.addModal.charactersRemaining')}
 </p>
 </div>

 <div className="flex gap-3 pt-4">
 <button
 type="button"
 onClick={handleClose}
 className="flex-1 px-4 py-2 border border-border dark:border-border text-foreground dark:text-muted-foreground rounded-lg hover:bg-muted/50 dark:hover:bg-foreground/80 transition-colors"
 disabled={isLoading}
 >
 {t('categories.addModal.cancel')}
 </button>
 <button
 type="submit"
 className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-brand hover:bg-brand-strong text-brand-foreground rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
 disabled={isLoading}
 >
 <FolderPlus className="w-4 h-4" />
 {isLoading ? t('categories.addModal.adding') : t('categories.addModal.addButton')}
 </button>
 </div>
 </form>
 </div>
 </div>
 );
}
