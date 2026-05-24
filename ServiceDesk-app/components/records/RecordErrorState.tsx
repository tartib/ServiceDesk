'use client';

/**
 * RecordErrorState — Reusable error/empty state components for record views.
 */

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AlertTriangle, FileX, WifiOff, RefreshCw, Plus } from 'lucide-react';

interface ErrorStateProps {
  type: 'not-found' | 'permission' | 'network' | 'generic';
  message?: string;
  onRetry?: () => void;
  onBack?: () => void;
}

export function RecordErrorState({ type, message, onRetry, onBack }: ErrorStateProps) {
  const { locale } = useLanguage();

  const configs: Record<string, { icon: React.ReactNode; title: string; titleAr: string; desc: string; descAr: string }> = {
    'not-found': {
      icon: <FileX className="w-14 h-14 text-muted-foreground opacity-60" />,
      title: 'Record Not Found',
      titleAr: 'لم يتم العثور على السجل',
      desc: 'This record may have been deleted or you may not have access to it.',
      descAr: 'ربما تم حذف هذا السجل أو ليس لديك صلاحية الوصول إليه.',
    },
    permission: {
      icon: <AlertTriangle className="w-14 h-14 text-warning opacity-60" />,
      title: 'Access Denied',
      titleAr: 'الوصول مرفوض',
      desc: 'You do not have permission to view this record.',
      descAr: 'ليس لديك صلاحية لعرض هذا السجل.',
    },
    network: {
      icon: <WifiOff className="w-14 h-14 text-muted-foreground opacity-60" />,
      title: 'Connection Error',
      titleAr: 'خطأ في الاتصال',
      desc: 'Please check your internet connection and try again.',
      descAr: 'يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى.',
    },
    generic: {
      icon: <AlertTriangle className="w-14 h-14 text-destructive opacity-60" />,
      title: 'Something Went Wrong',
      titleAr: 'حدث خطأ ما',
      desc: 'An unexpected error occurred. Please try again.',
      descAr: 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.',
    },
  };

  const config = configs[type] ?? configs.generic;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {config.icon}
      <h3 className="mt-4 text-lg font-semibold text-foreground">
        {locale === 'ar' ? config.titleAr : config.title}
      </h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-md">
        {message ?? (locale === 'ar' ? config.descAr : config.desc)}
      </p>
      <div className="flex gap-3 mt-6">
        {onBack && (
          <button
            onClick={onBack}
            className="px-4 py-2 border border-input rounded-lg text-sm text-muted-foreground hover:bg-accent"
          >
            {locale === 'ar' ? 'رجوع' : 'Go Back'}
          </button>
        )}
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-brand text-brand-foreground rounded-lg text-sm hover:bg-brand/90 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            {locale === 'ar' ? 'إعادة المحاولة' : 'Retry'}
          </button>
        )}
      </div>
    </div>
  );
}

interface EmptyStateProps {
  type: 'records' | 'drafts';
  onAction?: () => void;
}

export function RecordEmptyState({ type, onAction }: EmptyStateProps) {
  const { locale } = useLanguage();

  const configs: Record<string, { title: string; titleAr: string; desc: string; descAr: string; action: string; actionAr: string }> = {
    records: {
      title: 'No Records Yet',
      titleAr: 'لا توجد سجلات بعد',
      desc: 'Create your first request to get started.',
      descAr: 'أنشئ طلبك الأول للبدء.',
      action: 'Create Request',
      actionAr: 'إنشاء طلب',
    },
    drafts: {
      title: 'No Drafts',
      titleAr: 'لا توجد مسودات',
      desc: 'Drafts are saved automatically while you fill out a request.',
      descAr: 'يتم حفظ المسودات تلقائياً أثناء ملء الطلب.',
      action: 'Start New Request',
      actionAr: 'بدء طلب جديد',
    },
  };

  const config = configs[type] ?? configs.records;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <FileX className="w-14 h-14 text-muted-foreground opacity-40" />
      <h3 className="mt-4 text-lg font-semibold text-foreground">
        {locale === 'ar' ? config.titleAr : config.title}
      </h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-md">
        {locale === 'ar' ? config.descAr : config.desc}
      </p>
      {onAction && (
        <button
          onClick={onAction}
          className="mt-6 px-4 py-2.5 bg-brand text-brand-foreground rounded-lg text-sm hover:bg-brand/90 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {locale === 'ar' ? config.actionAr : config.action}
        </button>
      )}
    </div>
  );
}
