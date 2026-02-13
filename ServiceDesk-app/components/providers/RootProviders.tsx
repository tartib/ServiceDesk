'use client';

import { useEffect, useState } from 'react';
import QueryProvider from '@/components/providers/QueryProvider';
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext';
import { ToastProvider } from '@/components/ui/Toast';

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { locale } = useLanguage();
  const isArabic = locale === 'ar';
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      document.documentElement.lang = locale;
      document.documentElement.dir = isArabic ? 'rtl' : 'ltr';
    }
  }, [locale, isArabic, mounted]);

  return (
    <QueryProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </QueryProvider>
  );
}

export default function RootProviders({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <LayoutContent>{children}</LayoutContent>
    </LanguageProvider>
  );
}
