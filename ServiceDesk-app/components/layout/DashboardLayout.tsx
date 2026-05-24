'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Sidebar from '@/components/layout/Sidebar';
import QuickCreateDialog from '@/components/workspace/QuickCreateDialog';
import { useQuickCreate } from '@/hooks/useQuickCreate';
import { Plus } from 'lucide-react';
import { UserRole } from '@/types';

interface DashboardLayoutProps {
 children: React.ReactNode;
 allowedRoles?: UserRole[];
 /** Skip the max-w-7xl padded wrapper — use when the page manages its own layout (e.g. shell with sub-sidebar) */
 fullWidth?: boolean;
}

export default function DashboardLayout({ children, allowedRoles, fullWidth }: DashboardLayoutProps) {
 const quickCreate = useQuickCreate();
 return (
 <ProtectedRoute allowedRoles={allowedRoles}>
 <div className="flex h-screen bg-muted/50 overflow-hidden">
 <Sidebar />
 <main className="flex-1 flex flex-col overflow-hidden">
 {fullWidth ? (
   <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
     {children}
   </div>
 ) : (
   <div className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth">
     <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8 lg:py-10">
       {children}
     </div>
   </div>
 )}
 </main>
 {/* Quick Create: floating button + ⌘K dialog */}
 <button
  type="button"
  onClick={quickCreate.open}
  className="fixed bottom-6 ltr:right-6 rtl:left-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-lg hover:bg-brand-strong transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-border focus-visible:ring-offset-2"
  aria-label="Quick Create"
 >
  <Plus className="h-5 w-5" />
 </button>
 <QuickCreateDialog isOpen={quickCreate.isOpen} onClose={quickCreate.close} />
 </div>
 </ProtectedRoute>
 );
}
