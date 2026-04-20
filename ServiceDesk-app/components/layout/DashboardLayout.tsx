'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Sidebar from '@/components/layout/Sidebar';
import { UserRole } from '@/types';

interface DashboardLayoutProps {
 children: React.ReactNode;
 allowedRoles?: UserRole[];
 /** Skip the max-w-7xl padded wrapper — use when the page manages its own layout (e.g. shell with sub-sidebar) */
 fullWidth?: boolean;
}

export default function DashboardLayout({ children, allowedRoles, fullWidth }: DashboardLayoutProps) {
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
 </div>
 </ProtectedRoute>
 );
}
