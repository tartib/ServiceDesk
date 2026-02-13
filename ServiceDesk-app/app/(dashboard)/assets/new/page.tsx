'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
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
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import {
  useCreateAsset,
  AssetType,
  AssetStatus,
  AssetCondition,
  CreateAssetDTO,
} from '@/hooks/useAssets';

export default function NewAssetPage() {
  const { locale } = useLanguage();
  const router = useRouter();
  const createAsset = useCreateAsset();

  const [formData, setFormData] = useState<CreateAssetDTO>({
    name: '',
    name_ar: '',
    description: '',
    type: AssetType.HARDWARE,
    status: AssetStatus.IN_STOCK,
    condition: AssetCondition.NEW,
    serial_number: '',
    barcode: '',
    asset_model: '',
    manufacturer: '',
    category_id: '',
    tags: [],
    location: {
      building: '',
      floor: '',
      room: '',
    },
    purchase_info: {
      vendor: '',
      purchase_date: '',
      purchase_price: undefined,
      currency: 'SAR',
    },
    warranty: {
      start_date: '',
      end_date: '',
    },
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!formData.name || !formData.type) {
      alert(locale === 'ar' ? 'يرجى ملء الحقول المطلوبة' : 'Please fill in required fields');
      return;
    }

    setIsSaving(true);
    try {
      // Clean up empty fields before sending
      const cleanData: CreateAssetDTO = {
        name: formData.name,
        type: formData.type,
        status: formData.status,
        condition: formData.condition,
      };
      
      if (formData.name_ar) cleanData.name_ar = formData.name_ar;
      if (formData.description) cleanData.description = formData.description;
      if (formData.serial_number) cleanData.serial_number = formData.serial_number;
      if (formData.barcode) cleanData.barcode = formData.barcode;
      if (formData.asset_model) cleanData.asset_model = formData.asset_model;
      if (formData.manufacturer) cleanData.manufacturer = formData.manufacturer;
      if (formData.category_id) cleanData.category_id = formData.category_id;
      
      if (formData.location?.building || formData.location?.floor || formData.location?.room) {
        cleanData.location = {};
        if (formData.location.building) cleanData.location.building = formData.location.building;
        if (formData.location.floor) cleanData.location.floor = formData.location.floor;
        if (formData.location.room) cleanData.location.room = formData.location.room;
      }
      
      if (formData.purchase_info?.vendor || formData.purchase_info?.purchase_date || formData.purchase_info?.purchase_price) {
        cleanData.purchase_info = {};
        if (formData.purchase_info.vendor) cleanData.purchase_info.vendor = formData.purchase_info.vendor;
        if (formData.purchase_info.purchase_date) cleanData.purchase_info.purchase_date = formData.purchase_info.purchase_date;
        if (formData.purchase_info.purchase_price) cleanData.purchase_info.purchase_price = formData.purchase_info.purchase_price;
        if (formData.purchase_info.currency) cleanData.purchase_info.currency = formData.purchase_info.currency;
      }
      
      if (formData.warranty?.start_date || formData.warranty?.end_date) {
        cleanData.warranty = {};
        if (formData.warranty.start_date) cleanData.warranty.start_date = formData.warranty.start_date;
        if (formData.warranty.end_date) cleanData.warranty.end_date = formData.warranty.end_date;
      }

      await createAsset.mutateAsync(cleanData);
      router.push('/assets');
    } catch (error) {
      console.error('Error creating asset:', error);
      alert(locale === 'ar' ? 'حدث خطأ أثناء الحفظ' : 'Error saving asset');
    } finally {
      setIsSaving(false);
    }
  };

  const typeOptions = [
    { value: AssetType.HARDWARE, label: 'Hardware', label_ar: 'أجهزة' },
    { value: AssetType.SOFTWARE, label: 'Software', label_ar: 'برمجيات' },
    { value: AssetType.NETWORK, label: 'Network', label_ar: 'شبكات' },
    { value: AssetType.CLOUD, label: 'Cloud', label_ar: 'سحابي' },
    { value: AssetType.MOBILE, label: 'Mobile', label_ar: 'جوال' },
    { value: AssetType.VIRTUAL, label: 'Virtual', label_ar: 'افتراضي' },
    { value: AssetType.PERIPHERAL, label: 'Peripheral', label_ar: 'ملحقات' },
    { value: AssetType.OTHER, label: 'Other', label_ar: 'أخرى' },
  ];

  const statusOptions = [
    { value: AssetStatus.IN_STOCK, label: 'In Stock', label_ar: 'في المخزون' },
    { value: AssetStatus.ACTIVE, label: 'Active', label_ar: 'نشط' },
    { value: AssetStatus.RESERVED, label: 'Reserved', label_ar: 'محجوز' },
    { value: AssetStatus.IN_MAINTENANCE, label: 'In Maintenance', label_ar: 'صيانة' },
  ];

  const conditionOptions = [
    { value: AssetCondition.NEW, label: 'New', label_ar: 'جديد' },
    { value: AssetCondition.GOOD, label: 'Good', label_ar: 'جيد' },
    { value: AssetCondition.FAIR, label: 'Fair', label_ar: 'مقبول' },
    { value: AssetCondition.POOR, label: 'Poor', label_ar: 'سيء' },
    { value: AssetCondition.DAMAGED, label: 'Damaged', label_ar: 'تالف' },
  ];

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/assets">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">
                {locale === 'ar' ? 'إضافة أصل جديد' : 'Add New Asset'}
              </h1>
              <p className="text-muted-foreground">
                {locale === 'ar'
                  ? 'أدخل بيانات الأصل الجديد'
                  : 'Enter the new asset details'}
              </p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {locale === 'ar' ? 'حفظ' : 'Save'}
          </Button>
        </div>

        <div className="grid gap-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>{locale === 'ar' ? 'المعلومات الأساسية' : 'Basic Information'}</CardTitle>
              <CardDescription>
                {locale === 'ar' ? 'أدخل المعلومات الأساسية للأصل' : 'Enter the basic asset information'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{locale === 'ar' ? 'الاسم' : 'Name'} *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={locale === 'ar' ? 'اسم الأصل' : 'Asset name'}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{locale === 'ar' ? 'الاسم (عربي)' : 'Name (Arabic)'}</Label>
                  <Input
                    value={formData.name_ar}
                    onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                    placeholder="اسم الأصل بالعربي"
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{locale === 'ar' ? 'الوصف' : 'Description'}</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={locale === 'ar' ? 'وصف الأصل...' : 'Asset description...'}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>{locale === 'ar' ? 'النوع' : 'Type'} *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value as AssetType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {typeOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {locale === 'ar' ? opt.label_ar : opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{locale === 'ar' ? 'الحالة' : 'Status'}</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value as AssetStatus })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {locale === 'ar' ? opt.label_ar : opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{locale === 'ar' ? 'الحالة الفنية' : 'Condition'}</Label>
                  <Select
                    value={formData.condition}
                    onValueChange={(value) => setFormData({ ...formData, condition: value as AssetCondition })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {conditionOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {locale === 'ar' ? opt.label_ar : opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Identification */}
          <Card>
            <CardHeader>
              <CardTitle>{locale === 'ar' ? 'التعريف' : 'Identification'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{locale === 'ar' ? 'الشركة المصنعة' : 'Manufacturer'}</Label>
                  <Input
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    placeholder="Dell, HP, Lenovo..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>{locale === 'ar' ? 'الموديل' : 'Model'}</Label>
                  <Input
                    value={formData.asset_model}
                    onChange={(e) => setFormData({ ...formData, asset_model: e.target.value })}
                    placeholder="Model number"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{locale === 'ar' ? 'الرقم التسلسلي' : 'Serial Number'}</Label>
                  <Input
                    value={formData.serial_number}
                    onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                    placeholder="S/N"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{locale === 'ar' ? 'الباركود' : 'Barcode'}</Label>
                  <Input
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    placeholder="Barcode"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle>{locale === 'ar' ? 'الموقع' : 'Location'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>{locale === 'ar' ? 'المبنى' : 'Building'}</Label>
                  <Input
                    value={formData.location?.building}
                    onChange={(e) => setFormData({
                      ...formData,
                      location: { ...formData.location, building: e.target.value }
                    })}
                    placeholder={locale === 'ar' ? 'المبنى الرئيسي' : 'Main Building'}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{locale === 'ar' ? 'الطابق' : 'Floor'}</Label>
                  <Input
                    value={formData.location?.floor}
                    onChange={(e) => setFormData({
                      ...formData,
                      location: { ...formData.location, floor: e.target.value }
                    })}
                    placeholder="1, 2, 3..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>{locale === 'ar' ? 'الغرفة' : 'Room'}</Label>
                  <Input
                    value={formData.location?.room}
                    onChange={(e) => setFormData({
                      ...formData,
                      location: { ...formData.location, room: e.target.value }
                    })}
                    placeholder="101, Server Room..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Purchase Info */}
          <Card>
            <CardHeader>
              <CardTitle>{locale === 'ar' ? 'معلومات الشراء' : 'Purchase Information'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{locale === 'ar' ? 'المورد' : 'Vendor'}</Label>
                  <Input
                    value={formData.purchase_info?.vendor}
                    onChange={(e) => setFormData({
                      ...formData,
                      purchase_info: { ...formData.purchase_info, vendor: e.target.value }
                    })}
                    placeholder={locale === 'ar' ? 'اسم المورد' : 'Vendor name'}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{locale === 'ar' ? 'تاريخ الشراء' : 'Purchase Date'}</Label>
                  <Input
                    type="date"
                    value={formData.purchase_info?.purchase_date}
                    onChange={(e) => setFormData({
                      ...formData,
                      purchase_info: { ...formData.purchase_info, purchase_date: e.target.value }
                    })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label>{locale === 'ar' ? 'السعر' : 'Price'}</Label>
                  <Input
                    type="number"
                    value={formData.purchase_info?.purchase_price || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      purchase_info: { ...formData.purchase_info, purchase_price: Number(e.target.value) || undefined }
                    })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{locale === 'ar' ? 'العملة' : 'Currency'}</Label>
                  <Select
                    value={formData.purchase_info?.currency || 'SAR'}
                    onValueChange={(value) => setFormData({
                      ...formData,
                      purchase_info: { ...formData.purchase_info, currency: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SAR">SAR - ريال سعودي</SelectItem>
                      <SelectItem value="USD">USD - دولار أمريكي</SelectItem>
                      <SelectItem value="EUR">EUR - يورو</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Warranty */}
          <Card>
            <CardHeader>
              <CardTitle>{locale === 'ar' ? 'الضمان' : 'Warranty'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{locale === 'ar' ? 'تاريخ البداية' : 'Start Date'}</Label>
                  <Input
                    type="date"
                    value={formData.warranty?.start_date}
                    onChange={(e) => setFormData({
                      ...formData,
                      warranty: { ...formData.warranty, start_date: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{locale === 'ar' ? 'تاريخ الانتهاء' : 'End Date'}</Label>
                  <Input
                    type="date"
                    value={formData.warranty?.end_date}
                    onChange={(e) => setFormData({
                      ...formData,
                      warranty: { ...formData.warranty, end_date: e.target.value }
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
