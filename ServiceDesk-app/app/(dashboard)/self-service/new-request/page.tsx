'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useCreateServiceRequest, Priority } from '@/hooks/useServiceRequests';
import { useServiceCatalog, IServiceCatalogItem } from '@/hooks/useServiceCatalog';
import { useAuthStore } from '@/store/authStore';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { ArrowLeft, Send, HelpCircle, ChevronRight, Package, Clock, Zap, Search, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function NewServiceRequestPage() {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const { user } = useAuthStore();
  const createRequest = useCreateServiceRequest();

  const searchParams = useSearchParams();
  const preServiceId = searchParams.get('service_id');
  const preServiceName = searchParams.get('service_name');

  // Fetch real service catalog from API
  const { data: catalogData, isLoading: catalogLoading } = useServiceCatalog({ is_active: true });
  const services: IServiceCatalogItem[] = useMemo(() => catalogData?.data || [], [catalogData]);

  const [step, setStep] = useState<'select' | 'form'>(preServiceId ? 'form' : 'select');
  const [selectedService, setSelectedService] = useState<IServiceCatalogItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // When services load and we have a pre-selected service_id, find and select it
  useEffect(() => {
    if (preServiceId && services.length > 0 && !selectedService) {
      const match = services.find(s => s.service_id === preServiceId);
      if (match) {
        setSelectedService(match);
        setStep('form');
      }
    }
  }, [preServiceId, services, selectedService]);

  // Dynamic form fields state — keyed by field_id
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);
  const [justification, setJustification] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Reset dynamic form when service changes
  useEffect(() => {
    if (selectedService?.form) {
      const defaults: Record<string, string> = {};
      selectedService.form.forEach(field => {
        defaults[field.field_id] = field.default_value != null ? String(field.default_value) : '';
      });
      setFormData(defaults);
    } else {
      setFormData({});
    }
  }, [selectedService]);

  // Filter services for the selection grid
  const categories = useMemo(() => {
    const cats = new Set(services.map(s => s.category));
    return ['All', ...Array.from(cats)];
  }, [services]);

  const filteredServices = useMemo(() => {
    return services.filter(service => {
      const name = locale === 'ar' ? (service.name_ar || service.name) : service.name;
      const desc = locale === 'ar' ? (service.description_ar || service.description) : service.description;
      const matchesSearch = !searchQuery ||
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        desc.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || service.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [services, searchQuery, selectedCategory, locale]);

  const handleSelectService = (service: IServiceCatalogItem) => {
    setSelectedService(service);
    setStep('form');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError(locale === 'ar' ? 'يجب تسجيل الدخول أولاً' : 'You must be logged in to submit a request');
      return;
    }
    if (!selectedService) {
      setError(locale === 'ar' ? 'يجب اختيار خدمة' : 'Please select a service');
      return;
    }

    // Validate required dynamic fields
    if (selectedService.form?.length) {
      for (const field of selectedService.form) {
        if (field.required && !formData[field.field_id]?.trim()) {
          const label = locale === 'ar' ? (field.label_ar || field.label) : field.label;
          setError(locale === 'ar' ? `${label} مطلوب` : `${label} is required`);
          return;
        }
      }
    }

    if (!justification.trim()) {
      setError(locale === 'ar' ? 'سبب الطلب مطلوب' : 'Justification is required');
      return;
    }

    try {
      const serviceName = locale === 'ar'
        ? (selectedService.name_ar || selectedService.name)
        : selectedService.name;

      await createRequest.mutateAsync({
        service_id: selectedService.service_id,
        service_name: serviceName,
        priority,
        requester: {
          id: user._id || user.id || 'unknown',
          name: user.name || 'Unknown',
          email: user.email || 'unknown@example.com',
          department: (user as { department?: string }).department || 'IT',
        },
        form_data: { ...formData, justification },
        site_id: selectedService.site_id || 'SITE-001',
      });

      router.push('/self-service');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string; error?: string } } };
      setError(
        axiosErr?.response?.data?.message ||
        axiosErr?.response?.data?.error ||
        (locale === 'ar' ? 'حدث خطأ أثناء إرسال الطلب' : 'Failed to submit request')
      );
    }
  };

  // Render a dynamic form field from the service catalog item
  const renderFormField = (field: IServiceCatalogItem['form'][0]) => {
    const label = locale === 'ar' ? (field.label_ar || field.label) : field.label;
    const value = formData[field.field_id] || '';

    switch (field.type) {
      case 'select':
      case 'dropdown':
        return (
          <div key={field.field_id} className="space-y-2">
            <Label>{label} {field.required && '*'}</Label>
            <Select value={value} onValueChange={(v) => setFormData(prev => ({ ...prev, [field.field_id]: v }))}>
              <SelectTrigger>
                <SelectValue placeholder={field.placeholder || (locale === 'ar' ? 'اختر...' : 'Select...')} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {locale === 'ar' ? (opt.label_ar || opt.label) : opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      case 'textarea':
        return (
          <div key={field.field_id} className="space-y-2">
            <Label>{label} {field.required && '*'}</Label>
            <Textarea
              value={value}
              onChange={(e) => setFormData(prev => ({ ...prev, [field.field_id]: e.target.value }))}
              placeholder={field.placeholder || ''}
              rows={4}
              dir={locale === 'ar' ? 'rtl' : 'ltr'}
            />
          </div>
        );
      default:
        return (
          <div key={field.field_id} className="space-y-2">
            <Label>{label} {field.required && '*'}</Label>
            <Input
              type={field.type === 'number' ? 'number' : 'text'}
              value={value}
              onChange={(e) => setFormData(prev => ({ ...prev, [field.field_id]: e.target.value }))}
              placeholder={field.placeholder || ''}
              dir={locale === 'ar' ? 'rtl' : 'ltr'}
            />
          </div>
        );
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/self-service">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <HelpCircle className="h-6 w-6 text-blue-500" />
              {t('selfService.requestHelp')}
            </h1>
            <p className="text-muted-foreground">
              {step === 'select'
                ? (locale === 'ar' ? 'اختر الخدمة المطلوبة' : 'Select the service you need')
                : (locale === 'ar' ? 'أكمل تفاصيل الطلب' : 'Complete request details')}
            </p>
          </div>
        </div>

        {step === 'select' ? (
          <>
            {/* Search & Category Filter */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={locale === 'ar' ? 'ابحث عن خدمة...' : 'Search services...'}
                  className="pl-10"
                  dir={locale === 'ar' ? 'rtl' : 'ltr'}
                />
              </div>
            </div>

            {categories.length > 2 && (
              <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-colors ${
                      selectedCategory === cat
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {catalogLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="ml-3 text-muted-foreground">
                  {locale === 'ar' ? 'جاري تحميل الخدمات...' : 'Loading services...'}
                </span>
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  {locale === 'ar' ? 'لا توجد خدمات متاحة' : 'No services available'}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredServices.map((service) => (
                  <Card
                    key={service._id}
                    className="cursor-pointer hover:shadow-lg hover:border-primary transition-all group"
                    onClick={() => handleSelectService(service)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-blue-100 rounded-lg">
                            <Package className="h-4 w-4 text-blue-600" />
                          </div>
                          <CardTitle className="text-base group-hover:text-primary">
                            {locale === 'ar' ? (service.name_ar || service.name) : service.name}
                          </CardTitle>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <CardDescription className="mt-1">
                        {locale === 'ar' ? (service.description_ar || service.description) : service.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="bg-gray-100 px-2 py-0.5 rounded-full">{service.category}</span>
                        {service.fulfillment?.estimated_hours > 0 && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {service.fulfillment.estimated_hours}h
                          </span>
                        )}
                        {service.availability?.requires_approval && (
                          <span className="text-amber-600">
                            {locale === 'ar' ? 'يتطلب موافقة' : 'Requires approval'}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        ) : catalogLoading && !selectedService ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-3 text-muted-foreground">
              {locale === 'ar' ? 'جاري تحميل بيانات الخدمة...' : 'Loading service details...'}
            </span>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-blue-600" />
                    {locale === 'ar'
                      ? (selectedService?.name_ar || selectedService?.name || preServiceName)
                      : (selectedService?.name || preServiceName)}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {selectedService
                      ? (locale === 'ar'
                          ? (selectedService.description_ar || selectedService.description)
                          : selectedService.description)
                      : ''}
                  </CardDescription>
                  {selectedService && (
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      {selectedService.category && (
                        <span className="bg-gray-100 px-2 py-0.5 rounded-full">{selectedService.category}</span>
                      )}
                      {selectedService.fulfillment?.estimated_hours > 0 && (
                        <span className="flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          {locale === 'ar' ? 'الوقت المتوقع:' : 'Est:'} {selectedService.fulfillment.estimated_hours}h
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={() => { setStep('select'); setSelectedService(null); }}>
                  {locale === 'ar' ? 'تغيير' : 'Change'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-lg p-3 text-sm">
                    {error}
                  </div>
                )}

                {/* Dynamic form fields from service catalog */}
                {(selectedService?.form?.length ?? 0) > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      {locale === 'ar' ? 'تفاصيل الخدمة' : 'Service Details'}
                    </h3>
                    {selectedService!.form
                      .sort((a, b) => a.order - b.order)
                      .map(renderFormField)}
                  </div>
                )}

                <div className="space-y-2">
                  <Label>{locale === 'ar' ? 'الأولوية' : 'Priority'}</Label>
                  <Select
                    value={priority}
                    onValueChange={(value) => setPriority(value as Priority)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={Priority.LOW}>{locale === 'ar' ? 'منخفض' : 'Low'}</SelectItem>
                      <SelectItem value={Priority.MEDIUM}>{locale === 'ar' ? 'متوسط' : 'Medium'}</SelectItem>
                      <SelectItem value={Priority.HIGH}>{locale === 'ar' ? 'عالي' : 'High'}</SelectItem>
                      <SelectItem value={Priority.CRITICAL}>{locale === 'ar' ? 'حرج' : 'Critical'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{locale === 'ar' ? 'سبب الطلب' : 'Justification'} *</Label>
                  <Textarea
                    required
                    rows={5}
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    placeholder={locale === 'ar' ? 'اشرح سبب حاجتك لهذه الخدمة...' : 'Explain why you need this service...'}
                    dir={locale === 'ar' ? 'rtl' : 'ltr'}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => router.push('/self-service')}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={createRequest.isPending}
                  >
                    {createRequest.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        {t('common.loading')}
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        {locale === 'ar' ? 'إرسال الطلب' : 'Submit Request'}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
