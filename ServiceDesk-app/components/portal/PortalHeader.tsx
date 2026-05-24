'use client';

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Shield } from 'lucide-react';

interface PortalHeaderProps {
  organizationName?: string;
}

export default function PortalHeader({ organizationName }: PortalHeaderProps) {
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-brand-foreground">
            <Shield className="h-4 w-4" />
          </div>
          <div>
            <span className="text-sm font-semibold">{organizationName || t('workspace.portal.title')}</span>
          </div>
        </div>
        <span className="text-xs text-muted-foreground">{t('workspace.portal.poweredBy')}</span>
      </div>
    </header>
  );
}
