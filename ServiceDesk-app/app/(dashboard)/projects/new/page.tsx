'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TemplateGallery from '@/components/projects/templates/TemplateGallery';
import { ProjectWizard } from '@/components/projects/wizard';
import type { ProjectTemplate } from '@/components/projects/templates/projectTemplates';

export default function NewProjectPage() {
 const router = useRouter();
 const [wizardOpen, setWizardOpen] = useState(false);
 const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null | undefined>(undefined);

 const handleTemplateSelect = (template: ProjectTemplate | null) => {
  setSelectedTemplate(template);
  setWizardOpen(true);
 };

 const handleWizardClose = () => {
  setWizardOpen(false);
  setSelectedTemplate(undefined);
 };

 const handleWizardSuccess = (projectId: string) => {
  router.push(`/projects/${projectId}/board`);
 };

 return (
  <DashboardLayout fullWidth>
   <div className="flex flex-col h-full">
    {/* Top bar */}
    <div className="bg-background border-b border-border px-6 py-3 shrink-0">
     <div className="flex items-center gap-3">
      <Link
       href="/projects"
       className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
      >
       <ArrowLeft className="h-4 w-4" />
      </Link>
      <span className="text-sm text-muted-foreground">Back to Projects</span>
     </div>
    </div>

    {/* Gallery takes remaining height */}
    <div className="flex-1 overflow-hidden">
     <TemplateGallery onSelectTemplate={handleTemplateSelect} />
    </div>
   </div>

   {/* Wizard modal — rendered conditionally */}
   {wizardOpen && selectedTemplate !== undefined && (
    <ProjectWizard
     initialTemplate={selectedTemplate}
     onClose={handleWizardClose}
     onSuccess={handleWizardSuccess}
    />
   )}
  </DashboardLayout>
 );
}
