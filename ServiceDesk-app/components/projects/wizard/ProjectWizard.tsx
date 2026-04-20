'use client';

import { API_URL } from '@/lib/api/config';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import StepProjectInfo from './StepProjectInfo';
import StepMethodology from './StepMethodology';
import StepMethodologyConfig from './StepMethodologyConfig';
import StepReview from './StepReview';
import StepTemplate from './StepTemplate';
import { getDefaultLandingPage } from '@/hooks/useMethodology';
import type { ProjectTemplate } from '../templates/projectTemplates';

export type MethodologyType = 'scrum' | 'kanban' | 'waterfall' | 'itil' | 'lean' | 'okr';

export interface ProjectFormData {
 // Step 1: Project Info
 name: string;
 key: string;
 description: string;
 startDate: string;
 targetEndDate: string;
 
 // Step 2: Methodology
 methodology: MethodologyType;
 
 // Step 3: Methodology Config
 methodologyConfig: Record<string, unknown>;
}

const initialFormData: ProjectFormData = {
 name: '',
 key: '',
 description: '',
 startDate: '',
 targetEndDate: '',
 methodology: 'scrum',
 methodologyConfig: {},
};

const steps = [
 { id: 1, name: 'Template', description: 'Choose a starting template' },
 { id: 2, name: 'Project Info', description: 'Basic project details' },
 { id: 3, name: 'Methodology', description: 'Select project methodology' },
 { id: 4, name: 'Configuration', description: 'Configure methodology settings' },
 { id: 5, name: 'Review', description: 'Review and create' },
];

interface ProjectWizardProps {
 onClose: () => void;
 onSuccess?: (projectId: string) => void;
 /** Pre-select a template when the wizard opens (from the /projects/new gallery) */
 initialTemplate?: ProjectTemplate | null;
}

export default function ProjectWizard({ onClose, onSuccess, initialTemplate }: ProjectWizardProps) {
 const router = useRouter();
 const [currentStep, setCurrentStep] = useState(initialTemplate !== undefined ? 2 : 1);
 const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(initialTemplate ?? null);
 const [formData, setFormData] = useState<ProjectFormData>(
 initialTemplate
  ? {
    ...initialFormData,
    name: initialTemplate.defaultName,
    description: initialTemplate.defaultDescription,
    methodology: initialTemplate.methodology,
   }
  : initialFormData,
 );
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [error, setError] = useState<string | null>(null);

 const updateFormData = (updates: Partial<ProjectFormData>) => {
 setFormData((prev) => ({ ...prev, ...updates }));
 };

 const handleTemplateSelect = (template: ProjectTemplate | null) => {
  setSelectedTemplate(template);
  if (template) {
   setFormData((prev) => ({
    ...prev,
    name: prev.name || template.defaultName,
    description: prev.description || template.defaultDescription,
    methodology: template.methodology,
   }));
  }
 };

 const canProceed = (): boolean => {
 switch (currentStep) {
 case 1:
  return true; // Template step — always skippable
 case 2:
  return formData.name.trim() !== '' && formData.key.trim() !== '';
 case 3:
  return formData.methodology !== null;
 case 4:
  return true; // Config is optional
 case 5:
  return true;
 default:
  return false;
 }
 };

 const handleNext = () => {
 if (currentStep < steps.length && canProceed()) {
 setCurrentStep((prev) => prev + 1);
 }
 };

 const handleBack = () => {
 if (currentStep > 1) {
 setCurrentStep((prev) => prev - 1);
 }
 };

 const handleSubmit = async () => {
 setIsSubmitting(true);
 setError(null);

 try {
 const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
 if (!token) {
 throw new Error('Not authenticated');
 }

 // Create project
 const response = await fetch(`${API_URL}/pm/projects`, {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json',
 Authorization: `Bearer ${token}`,
 },
 body: JSON.stringify({
 name: formData.name,
 key: formData.key.toUpperCase(),
 description: formData.description,
 methodology: formData.methodology,
 startDate: formData.startDate || undefined,
 targetEndDate: formData.targetEndDate || undefined,
 }),
 });

 const data = await response.json();

 if (!response.ok) {
 const errMsg = typeof data.error === 'string' 
 ? data.error 
 : data.errors?.[0]?.message || data.error?.message || 'Failed to create project';
 throw new Error(errMsg);
 }

 const projectId =
 data.data?.project?._id ||
 data.data?.project?.id ||
 data.data?._id ||
 data.data?.id;

 if (!projectId) {
 console.error('Project creation response:', data);
 throw new Error('Project created but ID missing in response');
 }

 // Initialize methodology config
 await fetch(`${API_URL}/pm/projects/${projectId}/methodology`, {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json',
 Authorization: `Bearer ${token}`,
 },
 body: JSON.stringify({
 methodologyCode: formData.methodology,
 ...formData.methodologyConfig,
 }),
 });

 if (onSuccess) {
 onSuccess(projectId);
 } else {
 const landing = getDefaultLandingPage(formData.methodology as MethodologyType);
 router.push(`/projects/${projectId}${landing}`);
 }

 onClose();
 } catch (err) {
 setError(err instanceof Error ? err.message : 'An error occurred');
 } finally {
 setIsSubmitting(false);
 }
 };

 const renderStep = () => {
 switch (currentStep) {
 case 1:
  return <StepTemplate selectedTemplateId={selectedTemplate?.id ?? null} onSelect={handleTemplateSelect} />;
 case 2:
  return <StepProjectInfo formData={formData} updateFormData={updateFormData} />;
 case 3:
  return <StepMethodology formData={formData} updateFormData={updateFormData} />;
 case 4:
  return <StepMethodologyConfig formData={formData} updateFormData={updateFormData} />;
 case 5:
  return <StepReview formData={formData} />;
 default:
  return null;
 }
 };

 return (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
 <div className="bg-background rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
 {/* Header */}
 <div className="flex items-center justify-between px-6 py-4 border-b border-border">
 <h2 className="text-xl font-semibold text-foreground">Create New Project</h2>
 <button
 onClick={onClose}
 className="p-2 text-muted-foreground hover:text-muted-foreground hover:bg-muted rounded-lg transition-colors"
 >
 <X className="h-5 w-5" />
 </button>
 </div>

 {/* Progress Steps */}
 <div className="px-6 py-4 border-b border-border">
 <div className="flex items-start justify-between">
 {steps.map((step, index) => (
 <div key={step.id} className={`flex items-start ${index < steps.length - 1 ? 'flex-1' : ''}`}>
 <div className="flex flex-col items-center shrink-0">
 <div
 className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
 currentStep > step.id
 ? 'bg-success text-success-foreground'
 : currentStep === step.id
 ? 'bg-brand text-brand-foreground'
 : 'bg-muted text-muted-foreground'
 }`}
 >
 {currentStep > step.id ? <Check className="h-5 w-5" /> : step.id}
 </div>
 <div className="mt-2 text-center hidden sm:block">
 <p className={`text-xs font-medium whitespace-nowrap ${currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'}`}>
 {step.name}
 </p>
 </div>
 </div>
 {index < steps.length - 1 && (
 <div
 className={`flex-1 h-1 mx-2 mt-[18px] rounded transition-colors ${
 currentStep > step.id ? 'bg-success' : 'bg-muted'
 }`}
 />
 )}
 </div>
 ))}
 </div>
 </div>

 {/* Content */}
 <div className="flex-1 overflow-y-auto px-6 py-6">
 {error && (
 <div className="mb-4 p-4 bg-destructive-soft border border-destructive/30 rounded-lg text-destructive text-sm">
 {error}
 </div>
 )}
 {renderStep()}
 </div>

 {/* Footer */}
 <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/50">
 <button
 onClick={handleBack}
 disabled={currentStep === 1}
 className="flex items-center gap-2 px-4 py-2 text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
 >
 <ChevronLeft className="h-4 w-4" />
 Back
 </button>

 <div className="flex items-center gap-3">
 <button
 onClick={onClose}
 className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
 >
 Cancel
 </button>

 {currentStep < steps.length ? (
 <button
 onClick={handleNext}
 disabled={!canProceed()}
 className="flex items-center gap-2 px-6 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand-strong disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
 >
 Next
 <ChevronRight className="h-4 w-4" />
 </button>
 ) : (
 <button
 onClick={handleSubmit}
 disabled={isSubmitting}
 className="flex items-center gap-2 px-6 py-2 bg-success text-success-foreground rounded-lg hover:bg-success/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
 >
 {isSubmitting ? (
 <>
 <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
 Creating...
 </>
 ) : (
 <>
 <Check className="h-4 w-4" />
 Create Project
 </>
 )}
 </button>
 )}
 </div>
 </div>
 </div>
 </div>
 );
}
