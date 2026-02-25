'use client';

import dynamic from 'next/dynamic';
import { useLanguage } from '@/contexts/LanguageContext';

const WorkflowBuilder = dynamic(
  () => import('@/components/workflow-builder/WorkflowBuilder'),
  { ssr: false }
);

export default function WorkflowBuilderPage() {
  const { locale } = useLanguage();

  const handleSave = (data: { nodes: unknown[]; edges: unknown[]; name: string }) => {
    console.log('[WorkflowBuilder] Save:', data);
    // TODO: Call API to save definition
  };

  const handlePublish = (data: { nodes: unknown[]; edges: unknown[]; name: string }) => {
    console.log('[WorkflowBuilder] Publish:', data);
    // TODO: Call API to publish definition
  };

  return (
    <div className="h-[calc(100vh-64px)]">
      <WorkflowBuilder
        onSave={handleSave}
        onPublish={handlePublish}
        definitionName={locale === 'ar' ? 'سير عمل جديد' : 'New Workflow'}
      />
    </div>
  );
}
