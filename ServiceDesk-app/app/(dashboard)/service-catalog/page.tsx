'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Package,
  Search,
  Grid,
  List,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  Users,
  Zap,
} from 'lucide-react';
import { useServiceCatalog, IServiceCatalogItem } from '@/hooks/useServiceCatalog';
import { useLocale } from '@/hooks/useLocale';

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  active: { label: 'Active', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  inactive: { label: 'Inactive', color: 'bg-gray-100 text-gray-600', icon: XCircle },
  deprecated: { label: 'Deprecated', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
};

export default function ServiceCatalogStandalonePage() {
  const { t } = useLocale();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { data: catalogData, isLoading } = useServiceCatalog();
  const services: IServiceCatalogItem[] = useMemo(() => catalogData?.data || [], [catalogData]);

  const categories = useMemo(() => {
    const cats = new Set(services.map(s => s.category));
    return ['All', ...Array.from(cats)];
  }, [services]);

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getServiceStatus = (service: IServiceCatalogItem): string => {
    return service.availability?.is_active ? 'active' : 'inactive';
  };

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-3.5 w-3.5 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
        />
      ))}
      <span className="ml-1 text-xs text-gray-500">{rating.toFixed(1)}</span>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">{t('nav.serviceCatalog')}</h1>
            <span className="text-sm text-gray-500">({filteredServices.length} services)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
            </div>
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredServices.map((service) => {
              const status = getServiceStatus(service);
              const cfg = statusConfig[status] || statusConfig.active;
              const StatusIcon = cfg.icon;

              return (
                <div
                  key={service._id}
                  className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                      <Package className="h-6 w-6 text-blue-600" />
                    </div>
                    <span className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${cfg.color}`}>
                      <StatusIcon className="h-3 w-3" />
                      {cfg.label}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                    {service.name}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">{service.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">{service.category}</span>
                    {renderStars(service.metrics?.satisfaction_score || 0)}
                  </div>
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Zap className="h-3.5 w-3.5" />
                      Est: {service.fulfillment?.estimated_hours || 0}h
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {service.metrics?.total_requests || 0} requests
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/self-service/new-request?service_id=${service.service_id}&service_name=${encodeURIComponent(service.name)}`);
                    }}
                    className="w-full mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    Request Service
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase">
              <div className="col-span-3">Service</div>
              <div className="col-span-2">Category</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-1">Est. Time</div>
              <div className="col-span-2">Rating</div>
              <div className="col-span-2">Action</div>
            </div>
            {filteredServices.map((service) => {
              const status = getServiceStatus(service);
              const cfg = statusConfig[status] || statusConfig.active;
              const StatusIcon = cfg.icon;

              return (
                <div key={service._id} className="grid grid-cols-12 gap-4 px-4 py-4 border-b border-gray-100 hover:bg-gray-50 items-center">
                  <div className="col-span-3 flex items-center gap-3">
                    <Package className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">{service.name}</p>
                      <p className="text-xs text-gray-500 truncate max-w-xs">{service.description}</p>
                    </div>
                  </div>
                  <div className="col-span-2 text-sm text-gray-600">{service.category}</div>
                  <div className="col-span-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${cfg.color}`}>
                      <StatusIcon className="h-3 w-3" />
                      {cfg.label}
                    </span>
                  </div>
                  <div className="col-span-1 text-sm text-gray-600">{service.fulfillment?.estimated_hours || 0}h</div>
                  <div className="col-span-2">{renderStars(service.metrics?.satisfaction_score || 0)}</div>
                  <div className="col-span-2">
                    <button
                      onClick={() => router.push(`/self-service/new-request?service_id=${service.service_id}&service_name=${encodeURIComponent(service.name)}`)}
                      className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Request
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filteredServices.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No services found</p>
          </div>
        )}
      </div>
    </div>
  );
}
