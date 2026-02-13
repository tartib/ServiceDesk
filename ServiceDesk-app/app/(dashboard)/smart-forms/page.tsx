'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, FileText, Settings, BarChart3, Globe, GlobeLock, Eye, Grid3x3, List, Calendar } from 'lucide-react';
import { FormBuilder } from '@/components/smart-forms/builder';
import FormRenderer from '@/components/smart-forms/FormRenderer';
import SubmissionsDashboard from '@/components/smart-forms/SubmissionsDashboard';
import { 
  useFormTemplates, 
  useCreateFormTemplate, 
  useUpdateFormTemplate,
  useFormSubmissions,
  useCreateSubmission,
  usePublishFormTemplate,
  useUnpublishFormTemplate,
  useApproveSubmission,
  useRejectSubmission 
} from '@/hooks/useSmartForms';
import { FormTemplate, FormSubmission, UpdateFormTemplateDTO, CreateFormTemplateDTO } from '@/types/smart-forms';

export default function SmartFormsPage() {
  const { locale } = useLanguage();
  const [activeTab, setActiveTab] = useState('templates');
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Partial<FormTemplate> | null>(null);
  const [viewingSubmission, setViewingSubmission] = useState<FormSubmission | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { data: templatesData, isLoading } = useFormTemplates();
  const { data: submissionsData, isLoading: submissionsLoading, refetch: refetchSubmissions } = useFormSubmissions();
  const createTemplate = useCreateFormTemplate();
  const updateTemplate = useUpdateFormTemplate();
  const createSubmission = useCreateSubmission();
  const publishTemplate = usePublishFormTemplate();
  const unpublishTemplate = useUnpublishFormTemplate();
  const approveSubmission = useApproveSubmission();
  const rejectSubmission = useRejectSubmission();

  const handleApprove = async (submission: FormSubmission) => {
    const id = submission._id || submission.submission_id;
    try {
      await approveSubmission.mutateAsync({ submissionId: id });
      refetchSubmissions();
    } catch (error) {
      const msg = error instanceof Error ? error.message : (locale === 'ar' ? 'حدث خطأ' : 'An error occurred');
      alert(msg);
    }
  };

  const handleReject = async (submission: FormSubmission) => {
    const reason = prompt(locale === 'ar' ? 'سبب الرفض:' : 'Rejection reason:');
    if (reason === null) return;
    const id = submission._id || submission.submission_id;
    try {
      await rejectSubmission.mutateAsync({ submissionId: id, comments: reason });
      refetchSubmissions();
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

  const templates = templatesData?.data || [];
  const submissions = submissionsData?.data || [];

  const handleViewSubmission = (submission: FormSubmission) => {
    setViewingSubmission(submission);
  };

  const handleCreateNew = () => {
    setSelectedTemplate(null);
    setIsBuilderOpen(true);
  };

  const handleEditTemplate = (template: FormTemplate) => {
    setSelectedTemplate(template);
    setIsBuilderOpen(true);
  };

  const handlePreviewTemplate = (template: FormTemplate) => {
    setPreviewTemplate(template);
    setIsPreviewOpen(true);
  };

  const handleSaveTemplate = async (data: Partial<FormTemplate>) => {
    if (selectedTemplate) {
      await updateTemplate.mutateAsync({ 
        formId: selectedTemplate._id || selectedTemplate.form_id, 
        data: data as UpdateFormTemplateDTO 
      });
    } else {
      // Ensure required fields for new templates
      const createData: CreateFormTemplateDTO = {
        name: data.name || 'Untitled Form',
        name_ar: data.name_ar || data.name || 'نموذج بدون عنوان',
        description: data.description,
        description_ar: data.description_ar,
        category: data.category || 'general',
        fields: data.fields || [],
      };
      await createTemplate.mutateAsync(createData);
    }
    setIsBuilderOpen(false);
  };

  if (viewingSubmission) {
    const submissionTemplate = templates.find(
      t => t._id === viewingSubmission.form_template_id || t.form_id === viewingSubmission.form_template_id
    );
    const templateName = submissionTemplate
      ? (locale === 'ar' ? submissionTemplate.name_ar || submissionTemplate.name : submissionTemplate.name)
      : viewingSubmission.form_template_id;

    return (
      <DashboardLayout>
        <div className="container mx-auto py-6 max-w-3xl">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">
                {locale === 'ar' ? 'تفاصيل التقديم' : 'Submission Details'}
              </h1>
              <p className="text-muted-foreground text-sm mt-1">{viewingSubmission.submission_id}</p>
            </div>
            <div className="flex items-center gap-2">
              {(viewingSubmission.workflow_state?.status === 'pending_approval' || viewingSubmission.workflow_state?.status === 'submitted') && (
                <>
                  <Button
                    variant="default"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={async () => {
                      await handleApprove(viewingSubmission);
                      setViewingSubmission(null);
                    }}
                    disabled={approveSubmission.isPending}
                  >
                    {locale === 'ar' ? 'موافقة' : 'Approve'}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={async () => {
                      await handleReject(viewingSubmission);
                      setViewingSubmission(null);
                    }}
                    disabled={rejectSubmission.isPending}
                  >
                    {locale === 'ar' ? 'رفض' : 'Reject'}
                  </Button>
                </>
              )}
              <Button variant="outline" onClick={() => setViewingSubmission(null)}>
                {locale === 'ar' ? 'رجوع' : 'Back'}
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {/* Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{locale === 'ar' ? 'معلومات التقديم' : 'Submission Info'}</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">{locale === 'ar' ? 'النموذج' : 'Form'}</p>
                  <p className="font-medium">{templateName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{locale === 'ar' ? 'الحالة' : 'Status'}</p>
                  <p className="font-medium capitalize">{viewingSubmission.workflow_state?.status || viewingSubmission.status || 'submitted'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{locale === 'ar' ? 'مقدم الطلب' : 'Submitted By'}</p>
                  <p className="font-medium">{viewingSubmission.submitted_by?.name}</p>
                  <p className="text-xs text-muted-foreground">{viewingSubmission.submitted_by?.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{locale === 'ar' ? 'التاريخ' : 'Date'}</p>
                  <p className="font-medium">
                    {new Date(viewingSubmission.created_at).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
                      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Form Data */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{locale === 'ar' ? 'البيانات المقدمة' : 'Submitted Data'}</CardTitle>
              </CardHeader>
              <CardContent>
                {viewingSubmission.data && Object.keys(viewingSubmission.data).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(viewingSubmission.data).map(([key, value]) => {
                      const field = submissionTemplate?.fields?.find(f => f.field_id === key);
                      const label = field
                        ? (locale === 'ar' ? field.label_ar || field.label : field.label)
                        : key;
                      return (
                        <div key={key} className="flex justify-between items-start py-2 border-b last:border-0">
                          <span className="text-sm text-muted-foreground">{label}</span>
                          <span className="text-sm font-medium text-right max-w-[60%] break-words">
                            {value === null || value === undefined || value === ''
                              ? (locale === 'ar' ? '—' : '—')
                              : typeof value === 'object'
                                ? JSON.stringify(value)
                                : String(value)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    {locale === 'ar' ? 'لا توجد بيانات' : 'No data submitted'}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Timeline */}
            {viewingSubmission.timeline && viewingSubmission.timeline.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{locale === 'ar' ? 'السجل الزمني' : 'Timeline'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {viewingSubmission.timeline.map((event, idx) => (
                      <div key={idx} className="flex items-start gap-3 text-sm">
                        <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                        <div>
                          <p className="font-medium">{locale === 'ar' ? event.description_ar || event.description : event.description}</p>
                          {event.user_name && <p className="text-muted-foreground">{event.user_name}</p>}
                          <p className="text-xs text-muted-foreground">
                            {new Date(event.created_at).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
                              year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DashboardLayout>
    );
  }

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
                await createSubmission.mutateAsync({
                  form_template_id: templateId,
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
        <div className="h-full">
          <FormBuilder
            template={selectedTemplate || undefined}
            onSave={handleSaveTemplate}
            onPreview={(data) => {
              setPreviewTemplate(data);
              setIsPreviewOpen(true);
            }}
            onClose={() => setIsBuilderOpen(false)}
            locale={locale as 'en' | 'ar'}
          />
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
            {locale === 'ar' ? 'الردود' : 'Submissions'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates">
          {/* View Mode Toggle */}
          {templates && templates.length > 0 && (
            <div className="flex justify-end mb-4">
              <div className="flex items-center border border-gray-200 rounded-lg">
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'
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
            <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
              {templates.map((template: FormTemplate) => (
                <div
                  key={template._id || template.form_id}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
                >
                  {/* Icon */}
                  <div className="shrink-0 w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900 truncate">
                        {locale === 'ar' ? template.name_ar || template.name : template.name}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded shrink-0 ${
                        template.is_published
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
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
          <SubmissionsDashboard 
            submissions={submissions}
            templates={templates}
            isLoading={submissionsLoading}
            onView={handleViewSubmission}
            onApprove={handleApprove}
            onReject={handleReject}
            onRefresh={() => refetchSubmissions()}
            locale={locale as 'en' | 'ar'} 
          />
        </TabsContent>
      </Tabs>
      </div>
    </DashboardLayout>
  );
}
