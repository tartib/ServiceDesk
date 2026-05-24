'use client';

import React from 'react';
import PortalHeader from '@/components/portal/PortalHeader';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <PortalHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          {children}
        </div>
      </main>
    </div>
  );
}
