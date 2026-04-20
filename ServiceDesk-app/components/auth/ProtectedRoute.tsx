'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/types';

interface ProtectedRouteProps {
 children: React.ReactNode;
 allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
 const router = useRouter();
 const { isAuthenticated, user } = useAuthStore();
 const [hydrated, setHydrated] = useState(false);

 useEffect(() => {
   function getPersistedState() {
     try {
       const raw = localStorage.getItem('auth-storage');
       if (raw) return JSON.parse(raw)?.state ?? null;
     } catch { /* ignore */ }
     return null;
   }

   function check() {
     // Read from Zustand in-memory (post-hydration) OR directly from localStorage
     const zustandState = useAuthStore.getState();
     const persisted = zustandState.isAuthenticated ? zustandState : getPersistedState();
     if (!persisted?.isAuthenticated) {
       router.push('/login');
       return;
     }
     if (allowedRoles && persisted.user && !allowedRoles.includes(persisted.user.role as UserRole)) {
       router.push('/');
       return;
     }
     setHydrated(true);
   }

   if (useAuthStore.persist.hasHydrated()) {
     check();
   } else {
     // Force rehydrate then check
     useAuthStore.persist.rehydrate();
     const unsub = useAuthStore.persist.onFinishHydration(check);
     return unsub;
   }
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, []);

 if (!hydrated) {
 return <div className="h-screen w-screen bg-background" />;
 }

 if (!isAuthenticated) {
 return null;
 }

 if (allowedRoles && user && !allowedRoles.includes(user.role)) {
 return null;
 }

 return <>{children}</>;
}
