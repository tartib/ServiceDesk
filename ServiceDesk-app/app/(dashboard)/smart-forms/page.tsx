'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, FileText, Settings, BarChart3, Globe, GlobeLock, Eye, Grid3x3, List, Calendar, Save, X, Link2 } from 'lucide-react';
import FormDefinitionBuilder from '@/components/forms-platform/FormDefinitionBuilder';
import FormRenderer from '@/components/forms-platform/FormRenderer';
import RecordsDashboard from '@/components/forms-platform/RecordsDashboard';
import {
 useFormDefinitions,
 useCreateFormDefinition,
 useUpdateFormDefinition,
 usePublishFormDefinition,
 useUnpublishFormDefinition,
} from '@/hooks/useFormDefinitions';
import { useRecords, useApproveRecord, useRejectRecord, useCreateRecord } from '@/hooks/useRecords';
import type { SmartField } from '@/types/smart-forms';
import { FormTemplate } from '@/types/smart-forms';
import type { CreateFormDefinitionDTO, UpdateFormDefinitionDTO } from '@/lib/domains/forms/types';

export default function SmartFormsPage() {
 const { locale } = useLanguage();
 const [activeTab, setActiveTab] = useState('templates');
 const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);
 const [isBuilderOpen, setIsBuilderOpen] = useState(false);
 const [isPreviewOpen, setIsPreviewOpen] = useState(false);
 const [previewTemplate, setPreviewTemplate] = useState<Partial<FormTemplate> | null>(null);
 const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
 const [builderFields, setBuilderFields] = useState<SmartField[]>([]);
 const [builderName, setBuilderName] = useState('');
 const [isSaving, setIsSaving] = useState(false);
 const [copiedId, setCopiedId] = useState<string | null>(null);

 const handleCopyLink = (template: FormTemplate) => {
 const id = template.form_id || template._id;
 const url = `${window.location.origin}/forms/fill/${id}`;
 navigator.clipboard.writeText(url).then(() => {
 setCopiedId(id);
 setTimeout(() => setCopiedId(null), 2000);
 });
 };

 const { data: templatesData, isLoading } = useFormDefinitions();
 const { data: recordsData, isLoading: recordsLoading, refetch: refetchRecords } = useRecords();
 const createTemplate = useCreateFormDefinition();
 const updateTemplate = useUpdateFormDefinition();
 const publishTemplate = usePublishFormDefinition();
 const unpublishTemplate = useUnpublishFormDefinition();
 const approveRecord = useApproveRecord();
 const rejectRecord = useRejectRecord();
 const createRecord = useCreateRecord();

 const handleApprove = async (record: { _id?: string; submission_id?: string }) => {
 const id = (record._id || record.submission_id) as string;
 try {
 await approveRecord.mutateAsync({ id, approverId: id });
 refetchRecords();
 } catch (error) {
 const msg = error instanceof Error ? error.message : (locale === 'ar' ? 'حدث خطأ' : 'An error occurred');
 alert(msg);
 }
 };

 const handleReject = async (record: { _id?: string; submission_id?: string }) => {
 const reason = prompt(locale === 'ar' ? 'سبب الرفض:' : 'Rejection reason:');
 if (reason === null) return;
 const id = (record._id || record.submission_id) as string;
 try {
 await rejectRecord.mutateAsync({ id, approverId: id, reason: reason || '' });
 refetchRecords();
 } catch (error) {
 const msg = error instanceof Error ? error.message : (locale === 'ar' ? 'حدث خطأ' : 'An error occurred');
 alert(msg);
 }
 };

 const handleTogglePublish = async (template: FormTemplate) => {
 const id = template._id || template.form_id;
 if (!id) return;
 try {
 if (template.is_published) {
 await unpublishTemplate.mutateAsync(id);
 } else {
 await publishTemplate.mutateAsync(id);
 }
 } catch (error) {
 const msg = error instanceof Error ? error.message : (locale === 'ar' ? 'حدث خطأ' : 'An error occurred');
 alert(msg);
 }
 };

 const templates = (templatesData?.definitions || []) as FormTemplate[];
 const records = recordsData?.records || [];

 const handleCreateNew = () => {
 setSelectedTemplate(null);
 setIsBuilderOpen(true);
 };

 const handleEditTemplate = (template: FormTemplate) => {
 setSelectedTemplate(template);
 setBuilderFields(template.fields || []);
 setBuilderName(locale === 'ar' ? template.name_ar || template.name : template.name);
 setIsBuilderOpen(true);
 };

 const handlePreviewTemplate = (template: FormTemplate) => {
 setPreviewTemplate(template);
 setIsPreviewOpen(true);
 };

 const handleSaveBuilder = async () => {
 setIsSaving(true);
 try {
 if (selectedTemplate) {
 await updateTemplate.mutateAsync({
 id: (selectedTemplate._id || selectedTemplate.form_id) as string,
 dto: { fields: builderFields } as UpdateFormDefinitionDTO,
 });
 } else {
 const createData: CreateFormDefinitionDTO = {
 name: builderName || 'Untitled Form',
 name_ar: builderName || 'نموذج بدون عنوان',
 category: 'general',
 };
 await createTemplate.mutateAsync(createData);
 }
 setIsBuilderOpen(false);
 } catch (error) {
 const msg = error instanceof Error ? error.message : (locale === 'ar' ? 'حدث خطأ' : 'An error occurred');
 alert(msg);
 } finally {
 setIsSaving(false);
 }
 };

 if (isPreviewOpen && previewTemplate) {
 return (
 <DashboardLayout>
 <div className="container mx-auto py-6 max-w-3xl">
 <div className="mb-4 flex justify-between items-center">
 <h1 className="text-2xl font-bold">
 {locale === 'ar' ? 'معاينة النموذج' : 'Form Preview'}
 </h1>
 <Button variant="outline" onClick={() => { setIsPreviewOpen(false); setPreviewTemplate(null); }}>
 {locale === 'ar' ? (isBuilderOpen ? 'العودة للمحرر' : 'إغلاق') : (isBuilderOpen ? 'Back to Editor' : 'Close')}
 </Button>
 </div>
 <FormRenderer
 template={previewTemplate as FormTemplate}
 onSubmit={async (data) => {
 const templateId = (previewTemplate as FormTemplate)?._id || (previewTemplate as FormTemplate)?.form_id;
 if (templateId) {
 try {
 await createRecord.mutateAsync({
 formTemplateId: templateId,
 data,
 });
 setIsPreviewOpen(false);
 setPreviewTemplate(null);
 setIsBuilderOpen(false);
 setActiveTab('submissions');
 } catch (error) {
 console.error('Submit error:', error);
 alert(locale === 'ar' ? 'حدث خطأ أثناء الإرسال' : 'Error submitting form');
 }
 } else {
 alert(locale === 'ar' ? 'يجب حفظ النموذج أولاً قبل الإرسال' : 'Please save the form first before submitting');
 }
 }}
 locale={locale as 'en' | 'ar'}
 />
 </div>
 </DashboardLayout>
 );
 }

 if (isBuilderOpen) {
 return (
 <DashboardLayout>
 <div className="flex flex-col h-full">
 <div className="flex items-center justify-between px-4 py-3 border-b bg-background shrink-0 gap-3">
 <h2 className="text-base font-semibold truncate">
 {selectedTemplate
 ? (locale === 'ar' ? selectedTemplate.name_ar || selectedTemplate.name : selectedTemplate.name)
 : (locale === 'ar' ? 'نموذج جديد' : 'New Form')}
 </h2>
 <div className="flex items-center gap-2">
 <Button
 variant="outline"
 size="sm"
 onClick={() => {
 setPreviewTemplate({ fields: builderFields, name: builderName } as Partial<FormTemplate>);
 setIsPreviewOpen(true);
 }}
 >
 <Eye className="h-4 w-4 me-1" />
 {locale === 'ar' ? 'معاينة' : 'Preview'}
 </Button>
 <Button size="sm" onClick={handleSaveBuilder} disabled={isSaving}>
 <Save className="h-4 w-4 me-1" />
 {isSaving ? (locale === 'ar' ? 'جاري الحفظ…' : 'Saving…') : (locale === 'ar' ? 'حفظ' : 'Save')}
 </Button>
 <Button variant="ghost" size="icon" onClick={() => setIsBuilderOpen(false)}>
 <X className="h-4 w-4" />
 </Button>
 </div>
 </div>
 <div className="flex-1 overflow-hidden">
 <FormDefinitionBuilder
 fields={builderFields}
 onChange={setBuilderFields}
 locale={locale as 'en' | 'ar'}
 height="100%"
 formId={selectedTemplate?.form_id}
 />
 </div>
 </div>
 </DashboardLayout>
 );
 }

 return (
 <DashboardLayout>
 <div className="container mx-auto py-6">
 <div className="flex justify-between items-center mb-6">
 <div>
 <h1 className="text-3xl font-bold">
 {locale === 'ar' ? 'النماذج الذكية' : 'Smart Forms'}
 </h1>
 <p className="text-muted-foreground mt-1">
 {locale === 'ar' 
 ? 'إنشاء وإدارة النماذج الديناميكية'
 : 'Create and manage dynamic forms'}
 </p>
 </div>
 <Button onClick={handleCreateNew}>
 <Plus className="h-4 w-4 me-2" />
 {locale === 'ar' ? 'نموذج جديد' : 'New Form'}
 </Button>
 </div>

 <Tabs value={activeTab} onValueChange={setActiveTab}>
 <TabsList className="mb-4">
 <TabsTrigger value="templates" className="flex items-center gap-2">
 <FileText className="h-4 w-4" />
 {locale === 'ar' ? 'القوالب' : 'Templates'}
 </TabsTrigger>
 <TabsTrigger value="submissions" className="flex items-center gap-2">
 <BarChart3 className="h-4 w-4" />
 {locale === 'ar' ? 'السجلات' : 'Records'}
 </TabsTrigger>
 </TabsList>

 <TabsContent value="templates">
 {/* View Mode Toggle */}
 {templates && templates.length > 0 && (
 <div className="flex justify-end mb-4">
 <div className="flex items-center border border-border rounded-lg">
 <Button
 variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
 size="icon"
 onClick={() => setViewMode('grid')}
 className="rounded-e-none"
 title={locale === 'ar' ? 'عرض شبكي' : 'Grid view'}
 >
 <Grid3x3 className="h-4 w-4" />
 </Button>
 <Button
 variant={viewMode === 'list' ? 'secondary' : 'ghost'}
 size="icon"
 onClick={() => setViewMode('list')}
 className="rounded-s-none"
 title={locale === 'ar' ? 'عرض قائمة' : 'List view'}
 >
 <List className="h-4 w-4" />
 </Button>
 </div>
 </div>
 )}

 {isLoading ? (
 <div className="flex justify-center py-12">
 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
 </div>
 ) : templates && templates.length > 0 ? (
 viewMode === 'grid' ? (
 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
 {templates.map((template: FormTemplate) => (
 <Card key={template._id || template.form_id} className="hover:shadow-md transition-shadow">
 <CardHeader>
 <CardTitle className="flex items-center justify-between">
 <span>{locale === 'ar' ? template.name_ar || template.name : template.name}</span>
 <span className={`text-xs px-2 py-1 rounded ${
 template.is_published 
 ? 'bg-success-soft text-success' 
 : 'bg-warning-soft text-warning'
 }`}>
 {template.is_published 
 ? (locale === 'ar' ? 'منشور' : 'Published')
 : (locale === 'ar' ? 'مسودة' : 'Draft')}
 </span>
 </CardTitle>
 <CardDescription>
 {template.description || (locale === 'ar' ? 'بدون وصف' : 'No description')}
 </CardDescription>
 </CardHeader>
 <CardContent>
 <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
 <span>{template.fields?.length || template.field_count || 0} {locale === 'ar' ? 'حقل' : 'fields'}</span>
 <span>{template.submission_count || 0} {locale === 'ar' ? 'رد' : 'submissions'}</span>
 </div>
 <div className="flex gap-2">
 <Button 
 variant="outline" 
 size="sm"
 onClick={() => handleEditTemplate(template)}
 >
 <Settings className="h-4 w-4" />
 </Button>
 <Button 
 variant="outline" 
 size="sm"
 onClick={() => handlePreviewTemplate(template)}
 >
 <Eye className="h-4 w-4" />
 </Button>
 {template.is_published && (
 <Button
 variant="outline"
 size="sm"
 onClick={() => handleCopyLink(template)}
 title={locale === 'ar' ? 'نسخ رابط المشاركة' : 'Copy share link'}
 >
 <Link2 className="h-4 w-4" />
 {copiedId === (template.form_id || template._id) && (
 <span className="ms-1 text-xs text-success">
 {locale === 'ar' ? 'تم النسخ' : 'Copied!'}
 </span>
 )}
 </Button>
 )}
 <Button 
 variant={template.is_published ? 'outline' : 'default'}
 size="sm" 
 className="flex-1"
 onClick={() => handleTogglePublish(template)}
 disabled={publishTemplate.isPending || unpublishTemplate.isPending}
 >
 {template.is_published ? (
 <>
 <GlobeLock className="h-4 w-4 me-1" />
 {locale === 'ar' ? 'إلغاء النشر' : 'Unpublish'}
 </>
 ) : (
 <>
 <Globe className="h-4 w-4 me-1" />
 {locale === 'ar' ? 'نشر' : 'Publish'}
 </>
 )}
 </Button>
 </div>
 </CardContent>
 </Card>
 ))}
 </div>
 ) : (
 /* List View */
 <div className="bg-card rounded-lg border border-border divide-y divide-border">
 {templates.map((template: FormTemplate) => (
 <div
 key={template._id || template.form_id}
 className="flex items-center gap-4 px-5 py-4 hover:bg-accent transition-colors">
 {/* Icon */}
 <div className="shrink-0 w-10 h-10 rounded-lg bg-brand-surface flex items-center justify-center">
 <FileText className="h-5 w-5 text-brand" />
 </div>

 {/* Content */}
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2">
 <span className="text-sm font-semibold text-foreground truncate">
 {locale === 'ar' ? template.name_ar || template.name : template.name}
 </span>
 <span className={`text-xs px-2 py-0.5 rounded shrink-0 ${
 template.is_published
 ? 'bg-success-soft text-success'
 : 'bg-warning-soft text-warning'
 }`}>
 {template.is_published
 ? (locale === 'ar' ? 'منشور' : 'Published')
 : (locale === 'ar' ? 'مسودة' : 'Draft')}
 </span>
 </div>
 <p className="text-xs text-muted-foreground mt-0.5 truncate">
 {template.description || (locale === 'ar' ? 'بدون وصف' : 'No description')}
 </p>
 </div>

 {/* Metrics */}
 <div className="hidden md:flex items-center gap-4 text-xs text-muted-foreground shrink-0">
 <span>{template.fields?.length || template.field_count || 0} {locale === 'ar' ? 'حقل' : 'fields'}</span>
 <span>{template.submission_count || 0} {locale === 'ar' ? 'رد' : 'responses'}</span>
 </div>

 {/* Date */}
 <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground shrink-0">
 <Calendar className="h-3 w-3" />
 {template.updated_at || template.created_at
 ? new Date(template.updated_at || template.created_at).toLocaleDateString(
 locale === 'ar' ? 'ar-SA' : 'en-US',
 { month: 'short', day: 'numeric' }
 )
 : '—'}
 </div>

 {/* Actions */}
 <div className="flex items-center gap-1 shrink-0">
 <Button
 variant="ghost"
 size="icon"
 className="h-8 w-8"
 onClick={() => handleEditTemplate(template)}
 title={locale === 'ar' ? 'تعديل' : 'Edit'}
 >
 <Settings className="h-4 w-4" />
 </Button>
 <Button
 variant="ghost"
 size="icon"
 className="h-8 w-8"
 onClick={() => handlePreviewTemplate(template)}
 title={locale === 'ar' ? 'معاينة' : 'Preview'}
 >
 <Eye className="h-4 w-4" />
 </Button>
 {template.is_published && (
 <Button
 variant="ghost"
 size="icon"
 className="h-8 w-8 relative"
 onClick={() => handleCopyLink(template)}
 title={locale === 'ar' ? 'نسخ رابط المشاركة' : 'Copy share link'}
 >
 <Link2 className="h-4 w-4" />
 {copiedId === (template.form_id || template._id) && (
 <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-medium text-success whitespace-nowrap">
 {locale === 'ar' ? 'تم!' : 'Copied!'}
 </span>
 )}
 </Button>
 )}
 <Button
 variant="ghost"
 size="icon"
 className="h-8 w-8"
 onClick={() => handleTogglePublish(template)}
 disabled={publishTemplate.isPending || unpublishTemplate.isPending}
 title={template.is_published
 ? (locale === 'ar' ? 'إلغاء النشر' : 'Unpublish')
 : (locale === 'ar' ? 'نشر' : 'Publish')}
 >
 {template.is_published
 ? <GlobeLock className="h-4 w-4" />
 : <Globe className="h-4 w-4" />}
 </Button>
 </div>
 </div>
 ))}
 </div>
 )
 ) : (
 <Card>
 <CardContent className="flex flex-col items-center justify-center py-12">
 <FileText className="h-12 w-12 text-muted-foreground mb-4" />
 <h3 className="text-lg font-medium mb-2">
 {locale === 'ar' ? 'لا توجد نماذج' : 'No forms yet'}
 </h3>
 <p className="text-muted-foreground mb-4">
 {locale === 'ar' 
 ? 'ابدأ بإنشاء نموذج جديد'
 : 'Get started by creating a new form'}
 </p>
 <Button onClick={handleCreateNew}>
 <Plus className="h-4 w-4 me-2" />
 {locale === 'ar' ? 'إنشاء نموذج' : 'Create Form'}
 </Button>
 </CardContent>
 </Card>
 )}
 </TabsContent>

 <TabsContent value="submissions">
 <RecordsDashboard
 records={records}
 templates={templates}
 isLoading={recordsLoading}
 onView={() => {}}
 onApprove={handleApprove}
 onReject={handleReject}
 onRefresh={() => refetchRecords()}
 locale={locale as 'en' | 'ar'}
 />
 </TabsContent>
 </Tabs>
 </div>
 </DashboardLayout>
 );
}
