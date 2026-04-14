'use client';

import { ThemeProvider } from 'next-themes';
import QueryProvider from '@/components/providers/QueryProvider';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import BrandTitleSync from '@/components/providers/BrandTitleSync';

export default function RootProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <LanguageProvider>
        <QueryProvider>
          <BrandTitleSync />
          <TooltipProvider>
            {children}
            <Toaster richColors position="top-right" />
          </TooltipProvider>
        </QueryProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
