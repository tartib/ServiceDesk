'use client';

import { API_URL } from '@/lib/api/config';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
 ArrowLeft,
 Loader2,
 RefreshCw,
 Columns3,
 Layers,
 Shield,
 Zap,
 Target,
 Check,
 FolderPlus,
 Calendar,
 KeyRound,
 FileText,
 AlignLeft,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useLanguage } from '@/contexts/LanguageContext';

const methodologies = [
 {
 code: 'scrum',
 name: 'Scrum',
 description: 'Iterative sprints with daily standups, sprint planning, and retrospectives.',
 icon: RefreshCw,
 color: 'bg-success-soft border-success/20 text-success',
 selectedColor: 'bg-success-soft border-success/50 ring-2 ring-emerald/30',
 iconBg: 'bg-success-soft text-success',
 },
 {
 code: 'kanban',
 name: 'Kanban',
 description: 'Continuous flow with WIP limits and visual board management.',
 icon: Columns3,
 color: 'bg-brand-surface border-brand-border text-brand',
 selectedColor: 'bg-brand-surface border-brand ring-2 ring-brand-border',
 iconBg: 'bg-brand-soft text-brand',
 },
 {
 code: 'waterfall',
 name: 'Waterfall',
 description: 'Sequential phases with formal milestones and gate reviews.',
 icon: Layers,
 color: 'bg-info-soft border-info/20 text-info',
 selectedColor: 'bg-info-soft border-info/50 ring-2 ring-info/30',
 iconBg: 'bg-info-soft text-info',
 },
 {
 code: 'itil',
 name: 'ITIL',
 description: 'IT service management with change advisory board and release calendar.',
 icon: Shield,
 color: 'bg-warning-soft border-warning/20 text-warning',
 selectedColor: 'bg-warning-soft border-warning/50 ring-2 ring-warning/30',
 iconBg: 'bg-warning-soft text-warning',
 },
 {
 code: 'lean',
 name: 'Lean',
 description: 'Value stream optimization with waste reduction focus.',
 icon: Zap,
 color: 'bg-warning-soft border-warning/20 text-warning',
 selectedColor: 'bg-warning-soft border-warning/50 ring-2 ring-amber/30',
 iconBg: 'bg-warning-soft text-warning',
 },
 {
 code: 'okr',
 name: 'OKR',
 description: 'Objectives and Key Results with quarterly goal tracking.',
 icon: Target,
 color: 'bg-destructive-soft border-destructive/20 text-destructive',
 selectedColor: 'bg-destructive-soft border-destructive/50 ring-2 ring-pink/30',
 iconBg: 'bg-destructive-soft text-destructive',
 },
];

export default function NewProjectPage() {
 const router = useRouter();
 const { t } = useLanguage();
 const [isLoading, setIsLoading] = useState(false);
 const [error, setError] = useState('');
 const [keyManuallyEdited, setKeyManuallyEdited] = useState(false);
 const [formData, setFormData] = useState({
 name: '',
 key: '',
 description: '',
 methodology: '',
 startDate: '',
 targetEndDate: '',
 });

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setError('');

 if (formData.key.length < 2 || formData.key.length > 10) {
 setError('Project key must be 2-10 characters');
 return;
 }

 setIsLoading(true);

 const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
 if (!token) {
 router.push('/login');
 return;
 }

 try {
 const response = await fetch(`${API_URL}/pm/projects`, {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json',
 Authorization: `Bearer ${token}`,
 },
 body: JSON.stringify({
 name: formData.name,
 key: formData.key,
 description: formData.description || undefined,
 methodology: formData.methodology,
 startDate: formData.startDate || undefined,
 targetEndDate: formData.targetEndDate || undefined,
 }),
 });

 const data = await response.json();

 if (!response.ok) {
 const validationErrors = data.details?.errors?.map((e: { field: string; message: string }) => e.message).join(', ');
 throw new Error(validationErrors || data.error?.message || data.error || data.message || 'Failed to create project');
 }

 const projectId = data.data?.project?._id || data.data?._id;

 if (projectId) {
 // Initialize methodology
 await fetch(`${API_URL}/pm/projects/${projectId}/methodology`, {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json',
 Authorization: `Bearer ${token}`,
 },
 body: JSON.stringify({ methodologyCode: formData.methodology }),
 }).catch(() => {});

 router.push(`/projects/${projectId}/board`);
 } else {
 router.push('/projects');
 }
 } catch (err) {
 setError(err instanceof Error ? err.message : 'Failed to create project');
 } finally {
 setIsLoading(false);
 }
 };

 const generateKey = (name: string) => {
 return name
 .toUpperCase()
 .replace(/[^A-Z0-9]/g, '')
 .slice(0, 6);
 };

 return (
 <DashboardLayout>
 <div className="min-h-full bg-muted/50">
 {/* Top Bar */}
 <div className="bg-background border-b border-border px-6 py-4">
 <div className="max-w-4xl mx-auto flex items-center gap-4">
 <Link
 href="/projects"
 className="p-2 text-muted-foreground hover:text-muted-foreground hover:bg-muted rounded-lg transition-colors"
 >
 <ArrowLeft className="h-5 w-5" />
 </Link>
 <div>
 <h1 className="text-xl font-semibold text-foreground">
 {t('projects.createProject') || 'Create New Project'}
 </h1>
 <p className="text-sm text-muted-foreground">
 {t('projects.createProjectDesc') || 'Set up your project details and choose a methodology'}
 </p>
 </div>
 </div>
 </div>

 {/* Content */}
 <div className="max-w-4xl mx-auto px-6 py-8">
 {error && (
 <div className="mb-6 p-4 bg-destructive-soft border border-destructive/30 rounded-xl text-destructive text-sm flex items-start gap-3">
 <div className="w-5 h-5 rounded-full bg-destructive-soft flex items-center justify-center shrink-0 mt-0.5">
 <span className="text-destructive text-xs font-bold">!</span>
 </div>
 <p>{error}</p>
 </div>
 )}

 <form onSubmit={handleSubmit} className="space-y-8">
 {/* Section 1: Project Details */}
 <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden">
 <div className="px-6 py-4 border-b border-border flex items-center gap-3">
 <div className="w-8 h-8 rounded-lg bg-brand-soft flex items-center justify-center">
 <FolderPlus className="h-4 w-4 text-brand" />
 </div>
 <div>
 <h2 className="text-base font-semibold text-foreground">
 {t('projects.projectDetails') || 'Project Details'}
 </h2>
 <p className="text-xs text-muted-foreground">
 {t('projects.projectDetailsDesc') || 'Basic information about your project'}
 </p>
 </div>
 </div>

 <div className="p-6 space-y-5">
 {/* Name & Key Row */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
 <div className="md:col-span-2">
 <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
 <FileText className="h-3.5 w-3.5 text-muted-foreground" />
 {t('projects.projectName') || 'Project Name'}
 <span className="text-destructive">*</span>
 </label>
 <input
 type="text"
 required
 value={formData.name}
 onChange={(e) => {
 const name = e.target.value;
 setFormData({
 ...formData,
 name,
 key: keyManuallyEdited ? formData.key : generateKey(name),
 });
 }}
 className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-brand transition-colors"
 placeholder={t('projects.projectNamePlaceholder') || 'e.g., Mobile App Redesign'}
 />
 </div>

 <div>
 <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
 <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
 {t('projects.projectKey') || 'Project Key'}
 <span className="text-destructive">*</span>
 </label>
 <input
 type="text"
 required
 minLength={2}
 maxLength={10}
 value={formData.key}
 onChange={(e) => {
 setKeyManuallyEdited(true);
 setFormData({ ...formData, key: e.target.value.toUpperCase() });
 }}
 className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-brand transition-colors font-mono uppercase"
 placeholder="PROJ"
 />
 <p className="mt-1.5 text-xs text-muted-foreground">
 {t('projects.keyHint') || 'Prefix for task IDs (e.g., PROJ-123)'}
 </p>
 </div>
 </div>

 {/* Description */}
 <div>
 <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
 <AlignLeft className="h-3.5 w-3.5 text-muted-foreground" />
 {t('projects.description') || 'Description'}
 <span className="text-xs text-muted-foreground font-normal">({t('common.optional') || 'Optional'})</span>
 </label>
 <textarea
 rows={3}
 value={formData.description}
 onChange={(e) => setFormData({ ...formData, description: e.target.value })}
 className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-brand transition-colors resize-none"
 placeholder={t('projects.descriptionPlaceholder') || 'Brief description of your project goals and scope...'}
 />
 </div>

 {/* Dates Row */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
 <div>
 <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
 <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
 {t('projects.startDate') || 'Start Date'}
 <span className="text-xs text-muted-foreground font-normal">({t('common.optional') || 'Optional'})</span>
 </label>
 <input
 type="date"
 value={formData.startDate}
 onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
 className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-brand transition-colors"
 />
 </div>
 <div>
 <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
 <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
 {t('projects.endDate') || 'Target End Date'}
 <span className="text-xs text-muted-foreground font-normal">({t('common.optional') || 'Optional'})</span>
 </label>
 <input
 type="date"
 value={formData.targetEndDate}
 onChange={(e) => setFormData({ ...formData, targetEndDate: e.target.value })}
 className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-brand transition-colors"
 />
 </div>
 </div>
 </div>
 </div>

 {/* Section 2: Methodology */}
 <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden">
 <div className="px-6 py-4 border-b border-border flex items-center gap-3">
 <div className="w-8 h-8 rounded-lg bg-info-soft flex items-center justify-center">
 <Layers className="h-4 w-4 text-info" />
 </div>
 <div>
 <h2 className="text-base font-semibold text-foreground">
 {t('projects.methodology') || 'Methodology'}
 <span className="text-destructive ml-1">*</span>
 </h2>
 <p className="text-xs text-muted-foreground">
 {t('projects.methodologyDesc') || 'Choose the framework that best fits your workflow'}
 </p>
 </div>
 </div>

 <div className="p-6">
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
 {methodologies.map((method) => {
 const Icon = method.icon;
 const isSelected = formData.methodology === method.code;
 return (
 <button
 key={method.code}
 type="button"
 onClick={() => setFormData({ ...formData, methodology: method.code })}
 className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 ${
 isSelected
 ? method.selectedColor
 : 'border-border hover:border-border hover:shadow-sm bg-background'
 }`}
 >
 {isSelected && (
 <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-brand flex items-center justify-center">
 <Check className="h-3 w-3 text-white" />
 </div>
 )}
 <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${method.iconBg}`}>
 <Icon className="h-5 w-5" />
 </div>
 <h3 className="font-semibold text-foreground mb-1">{method.name}</h3>
 <p className="text-xs text-muted-foreground leading-relaxed">{method.description}</p>
 </button>
 );
 })}
 </div>
 </div>
 </div>

 {/* Actions */}
 <div className="flex items-center justify-between pt-2 pb-8">
 <Link
 href="/projects"
 className="px-5 py-2.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors font-medium"
 >
 {t('projects.common.cancel') || 'Cancel'}
 </Link>
 <button
 type="submit"
 disabled={isLoading || !formData.methodology || !formData.name || formData.key.length < 2}
 className="flex items-center gap-2 px-8 py-2.5 bg-brand hover:bg-brand-strong disabled:bg-brand-soft disabled:cursor-not-allowed text-brand-foreground rounded-lg font-medium transition-colors shadow-sm"
 >
 {isLoading ? (
 <>
 <Loader2 className="h-4 w-4 animate-spin" />
 {t('projects.creating') || 'Creating...'}
 </>
 ) : (
 <>
 <FolderPlus className="h-4 w-4" />
 {t('projects.createProject') || 'Create Project'}
 </>
 )}
 </button>
 </div>
 </form>
 </div>
 </div>
 </DashboardLayout>
 );
}
