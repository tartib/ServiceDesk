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
  Plus,
  Trash2,
  Pencil,
} from 'lucide-react';
import { useServiceCatalog, IServiceCatalogItem } from '@/hooks/useServiceCatalog';
import { useLocale } from '@/hooks/useLocale';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import ServiceFormModal from '@/components/service-catalog/ServiceFormModal';
import DeleteServiceDialog from '@/components/service-catalog/DeleteServiceDialog';

const statusConfig: Record<string, { en: string; ar: string; color: string; icon: typeof CheckCircle }> = {
  active: { en: 'Active', ar: 'مفعل', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
  inactive: { en: 'Inactive', ar: 'غير مفعل', color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400', icon: XCircle },
  deprecated: { en: 'Deprecated', ar: 'مهمل', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Clock },
};

export default function ServiceCatalogStandalonePage() {
  const { t, locale } = useLocale();
  const isAr = locale === 'ar';
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editTarget, setEditTarget] = useState<IServiceCatalogItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

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
      <span className="ml-1 text-xs text-muted-foreground">{rating.toFixed(1)}</span>
    </div>
  );

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
    <div className="flex flex-col h-full bg-muted/50">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">{t('nav.serviceCatalog')}</h1>
            <span className="text-sm text-muted-foreground">({filteredServices.length} {isAr ? 'خدمة' : 'services'})</span>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4" />
              {isAr ? 'إضافة خدمة' : 'Add Service'}
            </Button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={isAr ? 'بحث عن خدمات...' : 'Search services...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
                dir={isAr ? 'rtl' : 'ltr'}
              />
            </div>
            <div className="flex items-center border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent'}`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent'}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-card border-b border-border px-6 py-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
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
                  className="bg-card border border-border rounded-xl p-5 hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                      <Package className="h-6 w-6 text-primary" />
                    </div>
                    <span className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${cfg.color}`}>
                      <StatusIcon className="h-3 w-3" />
                      {isAr ? cfg.ar : cfg.en}
                    </span>
                  </div>
                  <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                    {isAr ? (service.name_ar || service.name) : service.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{isAr ? (service.description_ar || service.description) : service.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{service.category}</span>
                    {renderStars(service.metrics?.satisfaction_score || 0)}
                  </div>
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Zap className="h-3.5 w-3.5" />
                      Est: {service.fulfillment?.estimated_hours || 0}h
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {service.metrics?.total_requests || 0} requests
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/self-service/new-request?service_id=${service.service_id}&service_name=${encodeURIComponent(service.name)}`);
                      }}
                    >
                      {isAr ? 'طلب الخدمة' : 'Request Service'}
                    </Button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditTarget(service);
                      }}
                      className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      title="Edit service"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget({ id: service.service_id, name: service.name });
                      }}
                      className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      title="Delete service"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <Card className="p-0">
            <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-border text-xs font-medium text-muted-foreground uppercase">
              <div className="col-span-3">{isAr ? 'الخدمة' : 'Service'}</div>
              <div className="col-span-2">{isAr ? 'الفئة' : 'Category'}</div>
              <div className="col-span-2">{isAr ? 'الحالة' : 'Status'}</div>
              <div className="col-span-1">{isAr ? 'الوقت' : 'Est. Time'}</div>
              <div className="col-span-2">{isAr ? 'التقييم' : 'Rating'}</div>
              <div className="col-span-2">{isAr ? 'إجراء' : 'Action'}</div>
            </div>
            {filteredServices.map((service) => {
              const status = getServiceStatus(service);
              const cfg = statusConfig[status] || statusConfig.active;
              const StatusIcon = cfg.icon;

              return (
                <div key={service._id} className="grid grid-cols-12 gap-4 px-4 py-4 border-b border-border hover:bg-accent/50 items-center">
                  <div className="col-span-3 flex items-center gap-3">
                    <Package className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">{isAr ? (service.name_ar || service.name) : service.name}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-xs">{isAr ? (service.description_ar || service.description) : service.description}</p>
                    </div>
                  </div>
                  <div className="col-span-2 text-sm text-muted-foreground">{service.category}</div>
                  <div className="col-span-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${cfg.color}`}>
                      <StatusIcon className="h-3 w-3" />
                      {isAr ? cfg.ar : cfg.en}
                    </span>
                  </div>
                  <div className="col-span-1 text-sm text-muted-foreground">{service.fulfillment?.estimated_hours || 0}h</div>
                  <div className="col-span-2">{renderStars(service.metrics?.satisfaction_score || 0)}</div>
                  <div className="col-span-2 flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => router.push(`/self-service/new-request?service_id=${service.service_id}&service_name=${encodeURIComponent(service.name)}`)}
                    >
                      {isAr ? 'طلب' : 'Request'}
                    </Button>
                    <button
                      onClick={() => setEditTarget(service)}
                      className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      title="Edit service"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget({ id: service.service_id, name: service.name })}
                      className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      title="Delete service"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </Card>
        )}

        {filteredServices.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">{isAr ? 'لا توجد خدمات' : 'No services found'}</p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="mt-4"
            >
              <Plus className="h-4 w-4" />
              {isAr ? 'إضافة أول خدمة' : 'Add First Service'}
            </Button>
          </div>
        )}
      </div>

      {/* Create/Edit Service Modal */}
      <ServiceFormModal
        open={showCreateModal || !!editTarget}
        onOpenChange={(open) => {
          if (!open) { setShowCreateModal(false); setEditTarget(null); }
        }}
        service={editTarget}
      />

      {/* Delete Service Dialog */}
      <DeleteServiceDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        serviceId={deleteTarget?.id || null}
        serviceName={deleteTarget?.name || ''}
      />
    </div>
    </DashboardLayout>
  );
}
