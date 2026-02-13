'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Search,
  Monitor,
  HardDrive,
  Wifi,
  Cloud,
  Smartphone,
  Package,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  User,
  MapPin,
} from 'lucide-react';
import Link from 'next/link';
import {
  useAssets,
  useAssetStats,
  useDeleteAsset,
  Asset,
  AssetType,
  AssetStatus,
} from '@/hooks/useAssets';

export default function AssetsPage() {
  const { locale } = useLanguage();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: assetsData, isLoading } = useAssets({
    page,
    limit: 20,
    search: search || undefined,
    type: typeFilter !== 'all' ? (typeFilter as AssetType) : undefined,
    status: statusFilter !== 'all' ? (statusFilter as AssetStatus) : undefined,
  });

  const { data: stats } = useAssetStats();
  const deleteAsset = useDeleteAsset();

  const assets = assetsData?.data || [];
  const pagination = assetsData?.pagination;

  const getTypeIcon = (type: AssetType) => {
    const icons: Record<AssetType, React.ReactNode> = {
      [AssetType.HARDWARE]: <Monitor className="h-4 w-4" />,
      [AssetType.SOFTWARE]: <HardDrive className="h-4 w-4" />,
      [AssetType.NETWORK]: <Wifi className="h-4 w-4" />,
      [AssetType.CLOUD]: <Cloud className="h-4 w-4" />,
      [AssetType.MOBILE]: <Smartphone className="h-4 w-4" />,
      [AssetType.VIRTUAL]: <Cloud className="h-4 w-4" />,
      [AssetType.PERIPHERAL]: <Package className="h-4 w-4" />,
      [AssetType.OTHER]: <Package className="h-4 w-4" />,
    };
    return icons[type] || <Package className="h-4 w-4" />;
  };

  const getStatusBadge = (status: AssetStatus) => {
    const config: Record<AssetStatus, { label: string; label_ar: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
      [AssetStatus.ACTIVE]: { label: 'Active', label_ar: 'نشط', variant: 'default', icon: <CheckCircle className="h-3 w-3" /> },
      [AssetStatus.INACTIVE]: { label: 'Inactive', label_ar: 'غير نشط', variant: 'secondary', icon: <XCircle className="h-3 w-3" /> },
      [AssetStatus.IN_STOCK]: { label: 'In Stock', label_ar: 'في المخزون', variant: 'outline', icon: <Package className="h-3 w-3" /> },
      [AssetStatus.IN_MAINTENANCE]: { label: 'Maintenance', label_ar: 'صيانة', variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
      [AssetStatus.RETIRED]: { label: 'Retired', label_ar: 'متقاعد', variant: 'destructive', icon: <XCircle className="h-3 w-3" /> },
      [AssetStatus.DISPOSED]: { label: 'Disposed', label_ar: 'تم التخلص', variant: 'destructive', icon: <XCircle className="h-3 w-3" /> },
      [AssetStatus.LOST]: { label: 'Lost', label_ar: 'مفقود', variant: 'destructive', icon: <AlertTriangle className="h-3 w-3" /> },
      [AssetStatus.RESERVED]: { label: 'Reserved', label_ar: 'محجوز', variant: 'outline', icon: <Clock className="h-3 w-3" /> },
    };
    const c = config[status] || config[AssetStatus.IN_STOCK];
    return (
      <Badge variant={c.variant} className="gap-1">
        {c.icon}
        {locale === 'ar' ? c.label_ar : c.label}
      </Badge>
    );
  };

  const typeLabels: Record<AssetType, { en: string; ar: string }> = {
    [AssetType.HARDWARE]: { en: 'Hardware', ar: 'أجهزة' },
    [AssetType.SOFTWARE]: { en: 'Software', ar: 'برمجيات' },
    [AssetType.NETWORK]: { en: 'Network', ar: 'شبكات' },
    [AssetType.CLOUD]: { en: 'Cloud', ar: 'سحابي' },
    [AssetType.MOBILE]: { en: 'Mobile', ar: 'جوال' },
    [AssetType.VIRTUAL]: { en: 'Virtual', ar: 'افتراضي' },
    [AssetType.PERIPHERAL]: { en: 'Peripheral', ar: 'ملحقات' },
    [AssetType.OTHER]: { en: 'Other', ar: 'أخرى' },
  };

  const handleDelete = async (id: string) => {
    if (confirm(locale === 'ar' ? 'هل أنت متأكد من حذف هذا الأصل؟' : 'Are you sure you want to delete this asset?')) {
      await deleteAsset.mutateAsync(id);
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 md:gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-3xl font-bold leading-tight">
              {locale === 'ar' ? 'إدارة الأصول' : 'Asset Management'}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1 leading-relaxed">
              {locale === 'ar'
                ? 'تتبع وإدارة أصول تقنية المعلومات'
                : 'Track and manage IT assets'}
            </p>
          </div>
          <Link href="/assets/new">
            <Button className="h-10 md:h-11 whitespace-nowrap">
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{locale === 'ar' ? 'إضافة أصل' : 'Add Asset'}</span>
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {locale === 'ar' ? 'إجمالي الأصول' : 'Total Assets'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_assets || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {locale === 'ar' ? 'نشط' : 'Active'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats?.by_status?.active || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {locale === 'ar' ? 'في المخزون' : 'In Stock'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats?.by_status?.in_stock || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {locale === 'ar' ? 'ضمان قارب على الانتهاء' : 'Warranty Expiring'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats?.warranty_expiring_soon || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 md:gap-6">
              <div className="flex-1 min-w-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground shrink-0" />
                  <Input
                    placeholder={locale === 'ar' ? 'بحث بالاسم أو الرقم التسلسلي...' : 'Search by name or serial number...'}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 h-10 md:h-11"
                  />
                </div>
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-[180px] h-10 md:h-11">
                  <SelectValue placeholder={locale === 'ar' ? 'النوع' : 'Type'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{locale === 'ar' ? 'جميع الأنواع' : 'All Types'}</SelectItem>
                  {Object.values(AssetType).map((type) => (
                    <SelectItem key={type} value={type}>
                      {locale === 'ar' ? typeLabels[type].ar : typeLabels[type].en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px] h-10 md:h-11">
                  <SelectValue placeholder={locale === 'ar' ? 'الحالة' : 'Status'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{locale === 'ar' ? 'جميع الحالات' : 'All Statuses'}</SelectItem>
                  <SelectItem value={AssetStatus.ACTIVE}>{locale === 'ar' ? 'نشط' : 'Active'}</SelectItem>
                  <SelectItem value={AssetStatus.IN_STOCK}>{locale === 'ar' ? 'في المخزون' : 'In Stock'}</SelectItem>
                  <SelectItem value={AssetStatus.IN_MAINTENANCE}>{locale === 'ar' ? 'صيانة' : 'Maintenance'}</SelectItem>
                  <SelectItem value={AssetStatus.RETIRED}>{locale === 'ar' ? 'متقاعد' : 'Retired'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Assets List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : assets.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {locale === 'ar' ? 'لا توجد أصول' : 'No assets found'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {locale === 'ar'
                  ? 'ابدأ بإضافة أصل جديد'
                  : 'Start by adding a new asset'}
              </p>
              <Link href="/assets/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  {locale === 'ar' ? 'إضافة أصل' : 'Add Asset'}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {assets.map((asset: Asset) => (
              <Card key={asset._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-muted rounded-lg">
                        {getTypeIcon(asset.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Link href={`/assets/${asset.asset_id}`} className="font-medium hover:underline">
                            {locale === 'ar' ? asset.name_ar || asset.name : asset.name}
                          </Link>
                          <span className="text-sm text-muted-foreground">
                            {asset.asset_id}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {asset.asset_model && (
                            <span>{asset.manufacturer} {asset.asset_model}</span>
                          )}
                          {asset.serial_number && (
                            <span>S/N: {asset.serial_number}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-2">
                          {getStatusBadge(asset.status)}
                          <Badge variant="outline" className="gap-1">
                            {getTypeIcon(asset.type)}
                            {locale === 'ar' ? typeLabels[asset.type].ar : typeLabels[asset.type].en}
                          </Badge>
                          {asset.assigned_to?.user_name && (
                            <span className="flex items-center gap-1 text-sm text-muted-foreground">
                              <User className="h-3 w-3" />
                              {asset.assigned_to.user_name}
                            </span>
                          )}
                          {asset.location?.building && (
                            <span className="flex items-center gap-1 text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {asset.location.building}
                              {asset.location.room && ` - ${asset.location.room}`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/assets/${asset.asset_id}`}>
                        <Button variant="outline" size="sm">
                          {locale === 'ar' ? 'عرض' : 'View'}
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive"
                        onClick={() => handleDelete(asset.asset_id)}
                      >
                        {locale === 'ar' ? 'حذف' : 'Delete'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              {locale === 'ar' ? 'السابق' : 'Previous'}
            </Button>
            <span className="flex items-center px-4">
              {locale === 'ar'
                ? `صفحة ${page} من ${pagination.pages}`
                : `Page ${page} of ${pagination.pages}`}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={page === pagination.pages}
            >
              {locale === 'ar' ? 'التالي' : 'Next'}
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
