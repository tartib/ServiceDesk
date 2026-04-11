'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Server,
  Monitor,
  HardDrive,
  Network,
  Database,
  Cloud,
  Shield,
  Search,
  Plus,
  Filter,
  BarChart3,
  Link2,
  AlertTriangle,
  ChevronDown,
  Eye,
  Pencil,
  RefreshCw,
  Layers,
  Activity,
  Smartphone,
  Printer,
  FileText,
  Key,
} from 'lucide-react';
import api from '@/lib/axios';
import { useLocale } from '@/hooks/useLocale';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

interface ApiRes<T> {
  data: { success: boolean; data: T } | T;
}

interface ConfigItem {
  _id: string;
  ciId: string;
  name: string;
  nameAr?: string;
  description?: string;
  ciType: string;
  status: string;
  criticality: string;
  category: string;
  subcategory?: string;
  department?: string;
  location?: string;
  ownerName?: string;
  ownerId?: { _id: string; name: string; email: string };
  hostname?: string;
  ipAddress?: string;
  serialNumber?: string;
  lastUpdatedAt: string;
  createdAt: string;
}

interface CMDBStats {
  totalItems: number;
  totalRelationships: number;
  byStatus: Array<{ _id: string; count: number }>;
  byType: Array<{ _id: string; count: number }>;
  byCriticality: Array<{ _id: string; count: number }>;
  recentlyUpdated: ConfigItem[];
}

const ciTypeConfig: Record<string, { icon: typeof Server; label: string; labelAr: string; color: string }> = {
  hardware: { icon: HardDrive, label: 'Hardware', labelAr: 'أجهزة', color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' },
  software: { icon: Layers, label: 'Software', labelAr: 'برمجيات', color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20' },
  network: { icon: Network, label: 'Network', labelAr: 'شبكة', color: 'text-green-500 bg-green-50 dark:bg-green-900/20' },
  service: { icon: Activity, label: 'Service', labelAr: 'خدمة', color: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20' },
  virtual_machine: { icon: Monitor, label: 'Virtual Machine', labelAr: 'آلة افتراضية', color: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-900/20' },
  database: { icon: Database, label: 'Database', labelAr: 'قاعدة بيانات', color: 'text-red-500 bg-red-50 dark:bg-red-900/20' },
  application: { icon: Layers, label: 'Application', labelAr: 'تطبيق', color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' },
  server: { icon: Server, label: 'Server', labelAr: 'خادم', color: 'text-slate-500 bg-slate-50 dark:bg-slate-900/20' },
  workstation: { icon: Monitor, label: 'Workstation', labelAr: 'محطة عمل', color: 'text-teal-500 bg-teal-50 dark:bg-teal-900/20' },
  mobile_device: { icon: Smartphone, label: 'Mobile Device', labelAr: 'جهاز محمول', color: 'text-pink-500 bg-pink-50 dark:bg-pink-900/20' },
  printer: { icon: Printer, label: 'Printer', labelAr: 'طابعة', color: 'text-gray-500 bg-gray-50 dark:bg-gray-900/20' },
  storage: { icon: HardDrive, label: 'Storage', labelAr: 'تخزين', color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' },
  security: { icon: Shield, label: 'Security', labelAr: 'أمان', color: 'text-rose-500 bg-rose-50 dark:bg-rose-900/20' },
  cloud_resource: { icon: Cloud, label: 'Cloud Resource', labelAr: 'مورد سحابي', color: 'text-sky-500 bg-sky-50 dark:bg-sky-900/20' },
  license: { icon: Key, label: 'License', labelAr: 'رخصة', color: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' },
  document: { icon: FileText, label: 'Document', labelAr: 'مستند', color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' },
};

const statusConfig: Record<string, { label: string; labelAr: string; color: string }> = {
  active: { label: 'Active', labelAr: 'نشط', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  inactive: { label: 'Inactive', labelAr: 'غير نشط', color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' },
  retired: { label: 'Retired', labelAr: 'متقاعد', color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
  maintenance: { label: 'Maintenance', labelAr: 'صيانة', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  pending: { label: 'Pending', labelAr: 'قيد الانتظار', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
  decommissioned: { label: 'Decommissioned', labelAr: 'خارج الخدمة', color: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400' },
};

const criticalityConfig: Record<string, { label: string; labelAr: string; color: string }> = {
  critical: { label: 'Critical', labelAr: 'حرج', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  high: { label: 'High', labelAr: 'عالي', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  medium: { label: 'Medium', labelAr: 'متوسط', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  low: { label: 'Low', labelAr: 'منخفض', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
  trivial: { label: 'Trivial', labelAr: 'بسيط', color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' },
};

export default function CMDBPage() {
  const { locale } = useLocale();
  const isAr = locale === 'ar';
  const router = useRouter();

  const [items, setItems] = useState<ConfigItem[]>([]);
  const [stats, setStats] = useState<CMDBStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCriticality, setSelectedCriticality] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = { page: String(page), limit: '20' };
      if (searchQuery) params.q = searchQuery;
      if (selectedType !== 'all') params.ciType = selectedType;
      if (selectedStatus !== 'all') params.status = selectedStatus;
      if (selectedCriticality !== 'all') params.criticality = selectedCriticality;

      const res = await api.get('/api/v2/itsm/cmdb/items', { params }) as ApiRes<{ items: ConfigItem[]; pagination: { pages: number } }>;
      const raw = res.data as Record<string, unknown>;
      const data = (raw?.data || raw) as { items?: ConfigItem[]; pagination?: { pages: number } };
      setItems(data?.items || []);
      setTotalPages(data?.pagination?.pages || 1);
    } catch (err) {
      console.error('Failed to fetch CMDB items:', err);
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, selectedType, selectedStatus, selectedCriticality]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/api/v2/itsm/cmdb/stats') as ApiRes<CMDBStats>;
      const raw = res.data as Record<string, unknown>;
      setStats((raw?.data || raw) as CMDBStats || null);
    } catch (err) {
      console.error('Failed to fetch CMDB stats:', err);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const getTypeConfig = (type: string) => ciTypeConfig[type] || ciTypeConfig.hardware;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {isAr ? 'قاعدة بيانات إدارة التهيئة' : 'Configuration Management Database'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isAr ? 'إدارة وتتبع جميع عناصر التهيئة في بيئتك' : 'Manage and track all configuration items in your environment'}
            </p>
          </div>
          <Button onClick={() => router.push('/cmdb/new')}>
            <Plus className="w-4 h-4" />
            {isAr ? 'إضافة عنصر' : 'Add CI'}
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-info/10 rounded-lg">
                  <Server className="w-5 h-5 text-info" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {isAr ? 'إجمالي العناصر' : 'Total CIs'}
                  </p>
                  <p className="text-xl font-bold text-foreground">{stats.totalItems}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-success/10 rounded-lg">
                  <Link2 className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {isAr ? 'العلاقات' : 'Relationships'}
                  </p>
                  <p className="text-xl font-bold text-foreground">{stats.totalRelationships}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-destructive/10 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {isAr ? 'حرجة' : 'Critical'}
                  </p>
                  <p className="text-xl font-bold text-foreground">
                    {stats.byCriticality?.find((c) => c._id === 'critical')?.count || 0}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {isAr ? 'الأنواع' : 'Types'}
                  </p>
                  <p className="text-xl font-bold text-foreground">{stats.byType?.length || 0}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Search & Filters */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={isAr ? 'بحث عن عناصر التهيئة...' : 'Search configuration items...'}
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>
            <Button
              variant={showFilters ? 'secondary' : 'outline'}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4" />
              {isAr ? 'فلاتر' : 'Filters'}
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>
            <Button
              variant="outline"
              onClick={() => { fetchItems(); fetchStats(); }}
            >
              <RefreshCw className="w-4 h-4" />
              {isAr ? 'تحديث' : 'Refresh'}
            </Button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-border grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  {isAr ? 'النوع' : 'Type'}
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => { setSelectedType(e.target.value); setPage(1); }}
                  className="w-full py-2 px-3 bg-muted border border-input rounded-lg text-sm"
                >
                  <option value="all">{isAr ? 'الكل' : 'All Types'}</option>
                  {Object.entries(ciTypeConfig).map(([key, cfg]) => (
                    <option key={key} value={key}>{isAr ? cfg.labelAr : cfg.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  {isAr ? 'الحالة' : 'Status'}
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
                  className="w-full py-2 px-3 bg-muted border border-input rounded-lg text-sm"
                >
                  <option value="all">{isAr ? 'الكل' : 'All Statuses'}</option>
                  {Object.entries(statusConfig).map(([key, cfg]) => (
                    <option key={key} value={key}>{isAr ? cfg.labelAr : cfg.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  {isAr ? 'الأهمية' : 'Criticality'}
                </label>
                <select
                  value={selectedCriticality}
                  onChange={(e) => { setSelectedCriticality(e.target.value); setPage(1); }}
                  className="w-full py-2 px-3 bg-muted border border-input rounded-lg text-sm"
                >
                  <option value="all">{isAr ? 'الكل' : 'All Levels'}</option>
                  {Object.entries(criticalityConfig).map(([key, cfg]) => (
                    <option key={key} value={key}>{isAr ? cfg.labelAr : cfg.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </Card>

        {/* CI Table */}
        <Card className="overflow-hidden p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="w-6 h-6 text-muted-foreground animate-spin" />
              <span className="ml-2 text-muted-foreground">{isAr ? 'جاري التحميل...' : 'Loading...'}</span>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Database className="w-12 h-12 mb-3 text-muted-foreground/50" />
              <p className="text-lg font-medium">{isAr ? 'لا توجد عناصر' : 'No configuration items found'}</p>
              <p className="text-sm mt-1">{isAr ? 'أضف عناصر تهيئة للبدء' : 'Add configuration items to get started'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      {isAr ? 'المعرف' : 'CI ID'}
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      {isAr ? 'الاسم' : 'Name'}
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      {isAr ? 'النوع' : 'Type'}
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      {isAr ? 'الحالة' : 'Status'}
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      {isAr ? 'الأهمية' : 'Criticality'}
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      {isAr ? 'المالك' : 'Owner'}
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      {isAr ? 'آخر تحديث' : 'Updated'}
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                      {isAr ? 'إجراءات' : 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((item) => {
                    const typeConf = getTypeConfig(item.ciType);
                    const TypeIcon = typeConf.icon;
                    const stConf = statusConfig[item.status] || statusConfig.active;
                    const crConf = criticalityConfig[item.criticality] || criticalityConfig.medium;

                    return (
                      <tr
                        key={item._id}
                        className="hover:bg-accent/50 cursor-pointer transition-colors"
                        onClick={() => router.push(`/cmdb/${item._id}`)}
                      >
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs text-muted-foreground">{item.ciId}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-lg ${typeConf.color}`}>
                              <TypeIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">
                                {isAr && item.nameAr ? item.nameAr : item.name}
                              </p>
                              {item.hostname && (
                                <p className="text-xs text-muted-foreground">{item.hostname}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-muted-foreground">
                            {isAr ? typeConf.labelAr : typeConf.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${stConf.color}`}>
                            {isAr ? stConf.labelAr : stConf.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${crConf.color}`}>
                            {isAr ? crConf.labelAr : crConf.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-muted-foreground text-xs">
                            {item.ownerName || item.ownerId?.name || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-muted-foreground text-xs">
                            {new Date(item.lastUpdatedAt || item.createdAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => router.push(`/cmdb/${item._id}`)}
                              className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                              title={isAr ? 'عرض' : 'View'}
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => router.push(`/cmdb/${item._id}/edit`)}
                              className="p-1.5 text-muted-foreground hover:text-warning hover:bg-warning/10 rounded-lg transition-colors"
                              title={isAr ? 'تعديل' : 'Edit'}
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                {isAr ? 'السابق' : 'Previous'}
              </Button>
              <span className="text-sm text-muted-foreground">
                {isAr ? `صفحة ${page} من ${totalPages}` : `Page ${page} of ${totalPages}`}
              </span>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                {isAr ? 'التالي' : 'Next'}
              </Button>
            </div>
          )}
        </Card>

        {/* Type Distribution (bottom cards) */}
        {stats && stats.byType && stats.byType.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              {isAr ? 'توزيع الأنواع' : 'Type Distribution'}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {stats.byType.map((typeItem) => {
                const conf = getTypeConfig(typeItem._id);
                const Icon = conf.icon;
                return (
                  <button
                    key={typeItem._id}
                    onClick={() => { setSelectedType(typeItem._id); setShowFilters(true); setPage(1); }}
                    className="bg-card rounded-xl border border-border p-3 hover:border-primary/30 transition-colors text-center"
                  >
                    <div className={`inline-flex p-2 rounded-lg ${conf.color} mb-2`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-medium text-foreground">{typeItem.count}</p>
                    <p className="text-xs text-muted-foreground">{isAr ? conf.labelAr : conf.label}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
