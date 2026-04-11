'use client';

import QueryProvider from '@/components/providers/QueryProvider';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';

export default function RootProviders({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <QueryProvider>
        <TooltipProvider>
          {children}
          <Toaster richColors position="top-right" />
        </TooltipProvider>
      </QueryProvider>
    </LanguageProvider>
  );
}
