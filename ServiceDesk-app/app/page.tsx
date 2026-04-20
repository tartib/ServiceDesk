'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function Home() {
 const router = useRouter();
 const { isAuthenticated } = useAuthStore();
 const [hydrated, setHydrated] = useState(false);

 useEffect(() => {
   if (useAuthStore.persist.hasHydrated()) {
     setHydrated(true);
     return;
   }
   const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
   return unsub;
 }, []);

 useEffect(() => {
 if (!hydrated) return;
 if (isAuthenticated) {
 router.replace('/homePage');
 } else {
 router.replace('/login');
 }
 }, [hydrated, isAuthenticated, router]);

 return null;
}
