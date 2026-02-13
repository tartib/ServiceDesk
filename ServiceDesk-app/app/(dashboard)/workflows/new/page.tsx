'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Workflow } from 'lucide-react';
import Link from 'next/link';
import { useCreateWorkflow } from '@/hooks/useWorkflows';

export default function NewWorkflowPage() {
  const { locale } = useLanguage();
  const router = useRouter();
  const createWorkflow = useCreateWorkflow();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      const workflow = await createWorkflow.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      router.push(`/workflows/${workflow._id}`);
    } catch (error) {
      console.error('Error creating workflow:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 max-w-lg">
        {/* Back link */}
        <Link href="/workflows" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-gray-900 mb-6">
          <ArrowLeft className="h-4 w-4" />
          {locale === 'ar' ? 'رجوع إلى سير العمل' : 'Back to Workflows'}
        </Link>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <Workflow className="h-5 w-5 text-purple-600" />
              </div>
              <CardTitle>
                {locale === 'ar' ? 'إنشاء سير عمل جديد' : 'Create New Workflow'}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="workflow-name">
                {locale === 'ar' ? 'اسم سير العمل' : 'Workflow Name'} *
              </Label>
              <Input
                id="workflow-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={locale === 'ar' ? 'أدخل اسم سير العمل' : 'Enter workflow name'}
                className="mt-1"
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
            </div>
            <div>
              <Label htmlFor="workflow-desc">
                {locale === 'ar' ? 'الوصف (اختياري)' : 'Description (optional)'}
              </Label>
              <Input
                id="workflow-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={locale === 'ar' ? 'أدخل وصف سير العمل' : 'Enter workflow description'}
                className="mt-1"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleCreate}
                disabled={!name.trim() || isSubmitting}
                className="flex-1"
              >
                {isSubmitting
                  ? (locale === 'ar' ? 'جاري الإنشاء...' : 'Creating...')
                  : (locale === 'ar' ? 'إنشاء والفتح في المحرر' : 'Create & Open Editor')}
              </Button>
              <Link href="/workflows">
                <Button variant="outline">
                  {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
