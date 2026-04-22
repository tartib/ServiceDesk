'use client';

import { useParams, useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
 Card,
 CardContent,
 CardHeader,
 CardTitle,
} from '@/components/ui/card';
import {
 ArrowLeft,
 Trash2,
 Monitor,
 HardDrive,
 Wifi,
 Cloud,
 Smartphone,
 Package,
 MapPin,
 User,
 Calendar,
 Hash,
 Building,
 DollarSign,
 Shield,
 Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { useAsset, useDeleteAsset, AssetType, AssetStatus, AssetCondition } from '@/hooks/useAssets';

const typeIcons: Record<string, React.ReactNode> = {
 [AssetType.HARDWARE]: <Monitor className="h-5 w-5" />,
 [AssetType.SOFTWARE]: <HardDrive className="h-5 w-5" />,
 [AssetType.NETWORK]: <Wifi className="h-5 w-5" />,
 [AssetType.CLOUD]: <Cloud className="h-5 w-5" />,
 [AssetType.MOBILE]: <Smartphone className="h-5 w-5" />,
 [AssetType.PERIPHERAL]: <Package className="h-5 w-5" />,
};

const typeLabels: Record<string, { en: string; ar: string }> = {
 [AssetType.HARDWARE]: { en: 'Hardware', ar: 'أجهزة' },
 [AssetType.SOFTWARE]: { en: 'Software', ar: 'برمجيات' },
 [AssetType.NETWORK]: { en: 'Network', ar: 'شبكات' },
 [AssetType.CLOUD]: { en: 'Cloud', ar: 'سحابي' },
 [AssetType.MOBILE]: { en: 'Mobile', ar: 'جوال' },
 [AssetType.VIRTUAL]: { en: 'Virtual', ar: 'افتراضي' },
 [AssetType.PERIPHERAL]: { en: 'Peripheral', ar: 'ملحقات' },
 [AssetType.OTHER]: { en: 'Other', ar: 'أخرى' },
};

const statusVariants: Record<string, string> = {
 [AssetStatus.ACTIVE]: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
 [AssetStatus.IN_STOCK]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
 [AssetStatus.IN_MAINTENANCE]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
 [AssetStatus.RESERVED]: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
 [AssetStatus.RETIRED]: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
 [AssetStatus.DISPOSED]: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const statusLabels: Record<string, { en: string; ar: string }> = {
 [AssetStatus.ACTIVE]: { en: 'Active', ar: 'نشط' },
 [AssetStatus.IN_STOCK]: { en: 'In Stock', ar: 'في المخزون' },
 [AssetStatus.IN_MAINTENANCE]: { en: 'In Maintenance', ar: 'صيانة' },
 [AssetStatus.RESERVED]: { en: 'Reserved', ar: 'محجوز' },
 [AssetStatus.RETIRED]: { en: 'Retired', ar: 'متقاعد' },
 [AssetStatus.DISPOSED]: { en: 'Disposed', ar: 'تم التخلص' },
};

const conditionLabels: Record<string, { en: string; ar: string }> = {
 [AssetCondition.NEW]: { en: 'New', ar: 'جديد' },
 [AssetCondition.GOOD]: { en: 'Good', ar: 'جيد' },
 [AssetCondition.FAIR]: { en: 'Fair', ar: 'مقبول' },
 [AssetCondition.POOR]: { en: 'Poor', ar: 'سيء' },
 [AssetCondition.DAMAGED]: { en: 'Damaged', ar: 'تالف' },
};

function DetailRow({ label, value, icon }: { label: string; value?: string | React.ReactNode; icon?: React.ReactNode }) {
 if (!value) return null;
 return (
  <div className="flex items-start gap-3 py-2.5">
   {icon && <span className="text-muted-foreground mt-0.5 shrink-0">{icon}</span>}
   <div className="min-w-0">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-sm font-medium">{value}</p>
   </div>
  </div>
 );
}

export default function AssetDetailPage() {
 const { assetId } = useParams<{ assetId: string }>();
 const { locale } = useLanguage();
 const router = useRouter();
 const { data: asset, isLoading, error } = useAsset(assetId);
 const deleteAsset = useDeleteAsset();
 const isAr = locale === 'ar';

 const handleDelete = async () => {
  if (!asset) return;
  const confirmed = confirm(isAr ? 'هل أنت متأكد من حذف هذا الأصل؟' : 'Are you sure you want to delete this asset?');
  if (!confirmed) return;
  try {
   await deleteAsset.mutateAsync(asset._id);
   router.push('/assets');
  } catch (e) {
   console.error('Delete failed', e);
  }
 };

 if (isLoading) {
  return (
   <DashboardLayout>
    <div className="flex items-center justify-center min-h-[60vh]">
     <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
   </DashboardLayout>
  );
 }

 if (error || !asset) {
  return (
   <DashboardLayout>
    <div className="container mx-auto py-6 max-w-4xl">
     <div className="flex items-center gap-4 mb-6">
      <Link href="/assets">
       <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
      </Link>
      <h1 className="text-2xl font-bold">{isAr ? 'الأصل غير موجود' : 'Asset Not Found'}</h1>
     </div>
     <Card>
      <CardContent className="py-12 text-center text-muted-foreground">
       {isAr ? 'لم يتم العثور على الأصل المطلوب.' : 'The requested asset could not be found.'}
      </CardContent>
     </Card>
    </div>
   </DashboardLayout>
  );
 }

 const tLabel = typeLabels[asset.type] || { en: asset.type, ar: asset.type };
 const sLabel = statusLabels[asset.status] || { en: asset.status, ar: asset.status };
 const cLabel = conditionLabels[asset.condition] || { en: asset.condition, ar: asset.condition };

 return (
  <DashboardLayout>
   <div className="container mx-auto py-6 max-w-4xl">
    {/* Header */}
    <div className="flex items-center justify-between mb-6">
     <div className="flex items-center gap-4">
      <Link href="/assets">
       <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
      </Link>
      <div className="flex items-center gap-3">
       <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
        {typeIcons[asset.type] || <Package className="h-5 w-5" />}
       </div>
       <div>
        <h1 className="text-2xl font-bold">{isAr ? asset.name_ar || asset.name : asset.name}</h1>
        <p className="text-sm text-muted-foreground">{asset.asset_id}</p>
       </div>
      </div>
     </div>
     <div className="flex items-center gap-2">
      <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleteAsset.isPending}>
       <Trash2 className="h-4 w-4 mr-1" />
       {isAr ? 'حذف' : 'Delete'}
      </Button>
     </div>
    </div>

    {/* Badges row */}
    <div className="flex flex-wrap gap-2 mb-6">
     <Badge className={statusVariants[asset.status] || ''}>
      {isAr ? sLabel.ar : sLabel.en}
     </Badge>
     <Badge variant="outline">{isAr ? tLabel.ar : tLabel.en}</Badge>
     <Badge variant="secondary">{isAr ? cLabel.ar : cLabel.en}</Badge>
    </div>

    <div className="grid gap-6 md:grid-cols-2">
     {/* Basic Info */}
     <Card>
      <CardHeader>
       <CardTitle className="text-base">{isAr ? 'المعلومات الأساسية' : 'Basic Information'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
       <DetailRow label={isAr ? 'الاسم' : 'Name'} value={asset.name} />
       {asset.name_ar && <DetailRow label={isAr ? 'الاسم (عربي)' : 'Name (Arabic)'} value={asset.name_ar} />}
       {asset.description && <DetailRow label={isAr ? 'الوصف' : 'Description'} value={asset.description} />}
       <DetailRow label={isAr ? 'النوع' : 'Type'} value={isAr ? tLabel.ar : tLabel.en} icon={typeIcons[asset.type]} />
       <DetailRow label={isAr ? 'الحالة' : 'Status'} value={isAr ? sLabel.ar : sLabel.en} />
       <DetailRow label={isAr ? 'الحالة الفنية' : 'Condition'} value={isAr ? cLabel.ar : cLabel.en} />
      </CardContent>
     </Card>

     {/* Identification */}
     <Card>
      <CardHeader>
       <CardTitle className="text-base">{isAr ? 'التعريف' : 'Identification'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
       <DetailRow label={isAr ? 'معرف الأصل' : 'Asset ID'} value={asset.asset_id} icon={<Hash className="h-4 w-4" />} />
       <DetailRow label={isAr ? 'الرقم التسلسلي' : 'Serial Number'} value={asset.serial_number} icon={<Hash className="h-4 w-4" />} />
       <DetailRow label={isAr ? 'الباركود' : 'Barcode'} value={asset.barcode} />
       <DetailRow label={isAr ? 'الشركة المصنعة' : 'Manufacturer'} value={asset.manufacturer} icon={<Building className="h-4 w-4" />} />
       <DetailRow label={isAr ? 'الموديل' : 'Model'} value={asset.asset_model} />
      </CardContent>
     </Card>

     {/* Location */}
     {(asset.location?.building || asset.location?.floor || asset.location?.room) && (
      <Card>
       <CardHeader>
        <CardTitle className="text-base">{isAr ? 'الموقع' : 'Location'}</CardTitle>
       </CardHeader>
       <CardContent className="space-y-1">
        <DetailRow label={isAr ? 'المبنى' : 'Building'} value={asset.location.building} icon={<MapPin className="h-4 w-4" />} />
        <DetailRow label={isAr ? 'الطابق' : 'Floor'} value={asset.location.floor} />
        <DetailRow label={isAr ? 'الغرفة' : 'Room'} value={asset.location.room} />
       </CardContent>
      </Card>
     )}

     {/* Assignment */}
     {asset.assigned_to?.user_name && (
      <Card>
       <CardHeader>
        <CardTitle className="text-base">{isAr ? 'التعيين' : 'Assignment'}</CardTitle>
       </CardHeader>
       <CardContent className="space-y-1">
        <DetailRow label={isAr ? 'المستخدم' : 'Assigned To'} value={asset.assigned_to.user_name} icon={<User className="h-4 w-4" />} />
        <DetailRow label={isAr ? 'القسم' : 'Department'} value={asset.assigned_to.department} />
        <DetailRow
         label={isAr ? 'تاريخ التعيين' : 'Assigned Date'}
         value={asset.assigned_to.assigned_date ? new Date(asset.assigned_to.assigned_date).toLocaleDateString(isAr ? 'ar-SA' : 'en-US') : undefined}
         icon={<Calendar className="h-4 w-4" />}
        />
       </CardContent>
      </Card>
     )}

     {/* Purchase Info */}
     {(asset.purchase_info?.vendor || asset.purchase_info?.purchase_date || asset.purchase_info?.purchase_price) && (
      <Card>
       <CardHeader>
        <CardTitle className="text-base">{isAr ? 'معلومات الشراء' : 'Purchase Information'}</CardTitle>
       </CardHeader>
       <CardContent className="space-y-1">
        <DetailRow label={isAr ? 'المورد' : 'Vendor'} value={asset.purchase_info.vendor} icon={<Building className="h-4 w-4" />} />
        <DetailRow
         label={isAr ? 'تاريخ الشراء' : 'Purchase Date'}
         value={asset.purchase_info.purchase_date ? new Date(asset.purchase_info.purchase_date).toLocaleDateString(isAr ? 'ar-SA' : 'en-US') : undefined}
         icon={<Calendar className="h-4 w-4" />}
        />
        {asset.purchase_info.purchase_price != null && (
         <DetailRow
          label={isAr ? 'السعر' : 'Price'}
          value={`${asset.purchase_info.purchase_price.toLocaleString()} ${asset.purchase_info.currency || 'SAR'}`}
          icon={<DollarSign className="h-4 w-4" />}
         />
        )}
       </CardContent>
      </Card>
     )}

     {/* Warranty */}
     {asset.warranty?.end_date && (
      <Card>
       <CardHeader>
        <CardTitle className="text-base">{isAr ? 'الضمان' : 'Warranty'}</CardTitle>
       </CardHeader>
       <CardContent className="space-y-1">
        <DetailRow
         label={isAr ? 'تاريخ الانتهاء' : 'End Date'}
         value={new Date(asset.warranty.end_date).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
         icon={<Shield className="h-4 w-4" />}
        />
        {new Date(asset.warranty.end_date) < new Date() ? (
         <Badge variant="destructive" className="mt-2">{isAr ? 'منتهي' : 'Expired'}</Badge>
        ) : (
         <Badge className="mt-2 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          {isAr ? 'ساري' : 'Active'}
         </Badge>
        )}
       </CardContent>
      </Card>
     )}
    </div>

    {/* Timestamps */}
    <div className="mt-6 text-xs text-muted-foreground flex gap-6">
     <span>{isAr ? 'تاريخ الإنشاء' : 'Created'}: {new Date(asset.created_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}</span>
     <span>{isAr ? 'آخر تحديث' : 'Updated'}: {new Date(asset.updated_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}</span>
    </div>
   </div>
  </DashboardLayout>
 );
}
