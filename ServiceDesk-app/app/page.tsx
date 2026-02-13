'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Loader2 } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useLocale } from '@/hooks/useLocale';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { t } = useLocale();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8">
        {/* Header Section */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-bold mb-2 md:mb-4 leading-tight">{t('dashboard.title')}</h1>
          <p className="text-sm sm:text-base md:text-base text-gray-600 leading-relaxed">{t('dashboard.welcome')}</p>
        </div>

        {/* Main Content Grid - Responsive */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
          {/* Placeholder cards for responsive testing */}
          <button className="bg-white rounded-lg border border-gray-200 p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow min-h-44 md:min-h-52 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            <div className="h-24 md:h-32 w-full bg-gradient-to-br from-blue-50 to-blue-100 rounded flex items-center justify-center">
              <span className="text-gray-500 text-sm">Content Area 1</span>
            </div>
          </button>
          <button className="bg-white rounded-lg border border-gray-200 p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow min-h-44 md:min-h-52 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            <div className="h-24 md:h-32 w-full bg-gradient-to-br from-green-50 to-green-100 rounded flex items-center justify-center">
              <span className="text-gray-500 text-sm">Content Area 2</span>
            </div>
          </button>
          <button className="bg-white rounded-lg border border-gray-200 p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow min-h-44 md:min-h-52 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 md:col-span-2 lg:col-span-1">
            <div className="h-24 md:h-32 w-full bg-gradient-to-br from-purple-50 to-purple-100 rounded flex items-center justify-center">
              <span className="text-gray-500 text-sm">Content Area 3</span>
            </div>
          </button>
        </div>

        {/* Secondary Content Section */}
        <div className="mt-8 md:mt-12">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 md:mb-6 leading-tight">{t('dashboard.analytics')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[1, 2, 3, 4].map((item) => (
              <button key={item} className="bg-white rounded-lg border border-gray-200 p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow min-h-32 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                <div className="h-20 w-full bg-gray-50 rounded flex items-center justify-center">
                  <span className="text-gray-400 text-xs md:text-sm">Metric {item}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
