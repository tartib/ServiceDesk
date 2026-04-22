'use client';

import { API_URL } from '@/lib/api/config';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
 Settings,
 Users,
 Shield,
 Bell,
 Palette,
 Database,
 Trash2,
 Save,
 ChevronRight,
 Workflow,
 Tag,
 Plus,
 X,
 Edit3,
 Check,
 ListPlus,
 GripVertical,
 Archive,
 Pencil,
} from 'lucide-react';
import {
 ProjectHeader,
 ProjectNavTabs,
 LoadingState,
 ProjectMembersPanel,
 WorkflowSettingsPanel,
} from '@/components/projects';
import ProjectTeamsPanel from '@/components/projects/ProjectTeamsPanel';
import { useMethodology } from '@/hooks/useMethodology';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProjectTaskFields } from '@/hooks/useProjectTaskFields';
import type { TaskFieldDefinition, TaskCustomFieldType } from '@/types/task-fields';
import { ALLOWED_FIELD_TYPES } from '@/types/task-fields';
import { toast } from 'sonner';

const FIELD_TYPE_LABELS: Record<TaskCustomFieldType, string> = {
 text: 'Text',
 number: 'Number',
 select: 'Select',
 boolean: 'Boolean',
 phone: 'Phone',
 date: 'Date',
};

interface FieldFormState {
 id: string;
 name: string;
 type: TaskCustomFieldType;
 required: boolean;
 options: string[];
 defaultValue: string;
 appliesTo: string[];
}

const EMPTY_FIELD_FORM: FieldFormState = {
 id: '',
 name: '',
 type: 'text',
 required: false,
 options: [],
 defaultValue: '',
 appliesTo: [],
};

interface ProjectSettings {
 name: string;
 key: string;
 description: string;
 methodology: string;
 visibility: 'public' | 'private';
 notifications: {
 email: boolean;
 slack: boolean;
 inApp: boolean;
 };
 permissions: {
 allowGuestAccess: boolean;
 requireApproval: boolean;
 };
}

interface Project {
 _id: string;
 name: string;
 key: string;
}

interface Label {
 _id: string;
 name: string;
 color: string;
}

const methodologyOptions = [
 { value: 'scrum', label: 'Scrum', description: 'Iterative sprints with ceremonies' },
 { value: 'kanban', label: 'Kanban', description: 'Continuous flow with WIP limits' },
 { value: 'waterfall', label: 'Waterfall', description: 'Sequential phases with gates' },
 { value: 'itil', label: 'ITIL', description: 'IT service management' },
 { value: 'lean', label: 'Lean', description: 'Value stream optimization' },
 { value: 'okr', label: 'OKR', description: 'Objectives and Key Results' },
];

export default function ProjectSettingsPage() {
 const params = useParams();
 const router = useRouter();
 const projectId = params?.projectId as string;
 
 const { methodology } = useMethodology(projectId);
 const { t } = useLanguage();

 const [project, setProject] = useState<Project | null>(null);
 const [isLoading, setIsLoading] = useState(true);
 const [activeTab, setActiveTab] = useState('general');
 const [settings, setSettings] = useState<ProjectSettings>({
 name: '',
 key: '',
 description: '',
 methodology: 'scrum',
 visibility: 'private',
 notifications: {
 email: true,
 slack: false,
 inApp: true,
 },
 permissions: {
 allowGuestAccess: false,
 requireApproval: true,
 },
 });
 const [isSaving, setIsSaving] = useState(false);

 // Custom Fields
 const { activeFields: customFields, isLoading: isLoadingFields, createField, updateField, archiveField } = useProjectTaskFields(projectId);
 const [showFieldForm, setShowFieldForm] = useState(false);
 const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
 const [fieldForm, setFieldForm] = useState<FieldFormState>(EMPTY_FIELD_FORM);
 const [newFieldOption, setNewFieldOption] = useState('');
 const [isSavingField, setIsSavingField] = useState(false);

 const resetFieldForm = () => {
 setFieldForm(EMPTY_FIELD_FORM);
 setEditingFieldId(null);
 setShowFieldForm(false);
 setNewFieldOption('');
 };

 const startEditField = (field: TaskFieldDefinition) => {
 setFieldForm({
 id: field.id,
 name: field.name,
 type: field.type,
 required: field.required || false,
 options: field.options || [],
 defaultValue: field.defaultValue != null ? String(field.defaultValue) : '',
 appliesTo: field.appliesTo || [],
 });
 setEditingFieldId(field.id);
 setShowFieldForm(true);
 };

 const handleSaveField = async () => {
 if (!fieldForm.id.trim() || !fieldForm.name.trim()) {
 toast.error('ID and Name are required');
 return;
 }
 if (fieldForm.type === 'select' && fieldForm.options.length === 0) {
 toast.error('Select fields must have at least one option');
 return;
 }
 setIsSavingField(true);
 try {
 const payload: Partial<TaskFieldDefinition> & { id: string; name: string; type: TaskCustomFieldType } = {
 id: fieldForm.id.trim(),
 name: fieldForm.name.trim(),
 type: fieldForm.type,
 required: fieldForm.required,
 options: fieldForm.type === 'select' ? fieldForm.options : undefined,
 defaultValue: fieldForm.defaultValue || undefined,
 appliesTo: fieldForm.appliesTo.length > 0 ? fieldForm.appliesTo : undefined,
 };
 const ok = editingFieldId ? await updateField(editingFieldId, payload) : await createField(payload);
 if (ok) {
 toast.success(editingFieldId ? 'Field updated' : 'Field created');
 resetFieldForm();
 } else {
 toast.error('Failed to save field');
 }
 } finally {
 setIsSavingField(false);
 }
 };

 const handleArchiveField = async (fieldId: string) => {
 const ok = await archiveField(fieldId);
 if (ok) toast.success('Field archived');
 else toast.error('Failed to archive field');
 };

 const addFieldOption = () => {
 const val = newFieldOption.trim();
 if (!val) return;
 if (fieldForm.options.includes(val)) { toast.error('Option already exists'); return; }
 setFieldForm(prev => ({ ...prev, options: [...prev.options, val] }));
 setNewFieldOption('');
 };

 const removeFieldOption = (opt: string) => {
 setFieldForm(prev => ({ ...prev, options: prev.options.filter(o => o !== opt) }));
 };

 // Labels state
 const [labels, setLabels] = useState<Label[]>([]);
 const [newLabelName, setNewLabelName] = useState('');
 const [newLabelColor, setNewLabelColor] = useState('#6366f1');
 const [isCreatingLabel, setIsCreatingLabel] = useState(false);
 const [editingLabel, setEditingLabel] = useState<Label | null>(null);
 const [editLabelName, setEditLabelName] = useState('');
 const [editLabelColor, setEditLabelColor] = useState('');

 const fetchLabels = useCallback(async (token: string) => {
 try {
 const res = await fetch(`${API_URL}/pm/projects/${projectId}/labels`, {
 headers: { Authorization: `Bearer ${token}` },
 });
 const data = await res.json();
 if (data.success) setLabels(data.data.labels || []);
 } catch (error) {
 console.error('Failed to fetch labels:', error);
 }
 }, [projectId]);

 const fetchProject = useCallback(async (token: string) => {
 try {
 const res = await fetch(`${API_URL}/pm/projects/${projectId}`, {
 headers: { Authorization: `Bearer ${token}` },
 });
 const data = await res.json();
 if (data.success) {
 setProject(data.data.project);
 setSettings(prev => ({
 ...prev,
 name: data.data.project.name || '',
 key: data.data.project.key || '',
 description: data.data.project.description || '',
 methodology: data.data.project.methodology?.code || 'scrum',
 }));
 }
 } catch (error) {
 console.error('Failed to fetch project:', error);
 } finally {
 setIsLoading(false);
 }
 }, [projectId]);

 useEffect(() => {
 const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
 if (!token) {
 router.push('/login');
 return;
 }
 fetchProject(token);
 fetchLabels(token);
 }, [projectId, router, fetchProject, fetchLabels]);

 const handleCreateLabel = async () => {
 if (!newLabelName.trim()) return;
 const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
 if (!token) return;
 setIsCreatingLabel(true);
 try {
 const res = await fetch(`${API_URL}/pm/projects/${projectId}/labels`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
 body: JSON.stringify({ name: newLabelName.trim(), color: newLabelColor }),
 });
 const data = await res.json();
 if (data.success) {
 setLabels(prev => [...prev, data.data.label]);
 setNewLabelName('');
 setNewLabelColor('#6366f1');
 }
 } catch (error) {
 console.error('Failed to create label:', error);
 } finally {
 setIsCreatingLabel(false);
 }
 };

 const handleUpdateLabel = async () => {
 if (!editingLabel || !editLabelName.trim()) return;
 const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
 if (!token) return;
 try {
 const res = await fetch(`${API_URL}/pm/projects/labels/${editingLabel._id}`, {
 method: 'PATCH',
 headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
 body: JSON.stringify({ name: editLabelName.trim(), color: editLabelColor }),
 });
 const data = await res.json();
 if (data.success) {
 setLabels(prev => prev.map(l => l._id === editingLabel._id ? data.data.label : l));
 setEditingLabel(null);
 }
 } catch (error) {
 console.error('Failed to update label:', error);
 }
 };

 const handleDeleteLabel = async (labelId: string) => {
 const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
 if (!token) return;
 try {
 const res = await fetch(`${API_URL}/pm/projects/labels/${labelId}`, {
 method: 'DELETE',
 headers: { Authorization: `Bearer ${token}` },
 });
 if (res.ok) setLabels(prev => prev.filter(l => l._id !== labelId));
 } catch (error) {
 console.error('Failed to delete label:', error);
 }
 };

 const handleSave = async () => {
 const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
 if (!token) return;
 setIsSaving(true);
 try {
 const res = await fetch(`${API_URL}/pm/projects/${projectId}`, {
 method: 'PATCH',
 headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
 body: JSON.stringify({
 name: settings.name,
 key: settings.key,
 description: settings.description,
 methodology: { code: settings.methodology },
 visibility: settings.visibility,
 }),
 });
 const data = await res.json();
 if (data.success) {
 setProject(data.data.project);
 } else {
 console.error('Failed to save settings:', data.message);
 }
 } catch (error) {
 console.error('Failed to save project settings:', error);
 } finally {
 setIsSaving(false);
 }
 };

 const tabs = [
 { id: 'general', label: t('projects.settings.general') || 'General', icon: Settings },
 { id: 'methodology', label: t('projects.settings.methodology') || 'Methodology', icon: Database },
 { id: 'labels', label: 'Labels', icon: Tag },
 { id: 'customFields', label: 'Custom Fields', icon: ListPlus },
 { id: 'members', label: t('projects.settings.members') || 'Members', icon: Users },
 { id: 'teams', label: t('projects.settings.teams') || 'Teams', icon: Users },
 { id: 'permissions', label: t('projects.settings.permissions') || 'Permissions', icon: Shield },
 { id: 'notifications', label: t('projects.settings.notifications') || 'Notifications', icon: Bell },
 { id: 'workflows', label: t('projects.settings.workflows') || 'Workflows', icon: Workflow },
 { id: 'appearance', label: t('projects.settings.appearance') || 'Appearance', icon: Palette },
 { id: 'danger', label: t('projects.settings.dangerZone') || 'Danger Zone', icon: Trash2 },
 ];

 if (isLoading) {
 return <LoadingState />;
 }

 return (
 <div className="flex flex-col h-full bg-muted/50">
 {/* Project Header */}
 <ProjectHeader 
 projectKey={project?.key} 
 projectName={project?.name}
 projectId={projectId}
 />

 {/* Navigation Tabs */}
 <ProjectNavTabs projectId={projectId} methodology={methodology || 'scrum'} />

 {/* Main Content */}
 <div className="flex-1 overflow-hidden flex">
 {/* Sidebar */}
 <div className="w-64 bg-background border-r border-border overflow-y-auto">
 <div className="p-4">
 <h2 className="text-lg font-semibold text-foreground mb-4">{t('projects.settings.title') || 'Project Settings'}</h2>
 <nav className="space-y-1">
 {tabs.map((tab) => {
 const Icon = tab.icon;
 return (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id)}
 className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
 activeTab === tab.id
 ? 'bg-brand-surface text-brand'
 : tab.id === 'danger'
 ? 'text-destructive hover:bg-destructive-soft'
 : 'text-foreground hover:bg-muted'
 }`}
 >
 <Icon className="h-4 w-4" />
 <span>{tab.label}</span>
 <ChevronRight className="h-4 w-4 ml-auto opacity-50" />
 </button>
 );
 })}
 </nav>
 </div>
 </div>

 {/* Content Area */}
 <div className="flex-1 overflow-y-auto p-6">
 <div className="max-w-2xl">
 {/* General Settings */}
 {activeTab === 'general' && (
 <div className="space-y-6">
 <div>
 <h3 className="text-lg font-semibold text-foreground mb-4">{t('projects.settings.generalSettings') || 'General Settings'}</h3>
 <div className="space-y-4">
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">{t('projects.settings.projectName') || 'Project Name'}</label>
 <input
 type="text"
 value={settings.name}
 onChange={(e) => setSettings(prev => ({ ...prev, name: e.target.value }))}
 className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">{t('projects.settings.projectKey') || 'Project Key'}</label>
 <input
 type="text"
 value={settings.key}
 onChange={(e) => setSettings(prev => ({ ...prev, key: e.target.value.toUpperCase() }))}
 className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring font-mono"
 />
 <p className="text-xs text-muted-foreground mt-1">{t('projects.settings.keyDescription') || 'Used as prefix for issue keys (e.g., PROJ-123)'}</p>
 </div>
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">{t('projects.settings.description') || 'Description'}</label>
 <textarea
 value={settings.description}
 onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}
 rows={3}
 className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring resize-none"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">{t('projects.settings.visibility') || 'Visibility'}</label>
 <select
 value={settings.visibility}
 onChange={(e) => setSettings(prev => ({ ...prev, visibility: e.target.value as 'public' | 'private' }))}
 className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
 >
 <option value="private">{t('projects.settings.visibilityPrivate') || 'Private - Only members can access'}</option>
 <option value="public">{t('projects.settings.visibilityPublic') || 'Public - Anyone in organization can view'}</option>
 </select>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* Methodology Settings */}
 {activeTab === 'methodology' && (
 <div className="space-y-6">
 <div>
 <h3 className="text-lg font-semibold text-foreground mb-4">{t('projects.settings.projectMethodology') || 'Project Methodology'}</h3>
 <p className="text-sm text-muted-foreground mb-4">
 {t('projects.settings.methodologyDescription') || 'Choose the methodology that best fits your project workflow.'}
 </p>
 <div className="grid grid-cols-2 gap-4">
 {methodologyOptions.map((option) => (
 <button
 key={option.value}
 onClick={() => setSettings(prev => ({ ...prev, methodology: option.value }))}
 className={`p-4 border rounded-xl text-left transition-all ${
 settings.methodology === option.value
 ? 'border-brand bg-brand-surface ring-2 ring-brand-border'
 : 'border-border hover:border-border'
 }`}
 >
 <h4 className="font-semibold text-foreground">{option.label}</h4>
 <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
 </button>
 ))}
 </div>
 </div>
 </div>
 )}

 {/* Notifications Settings */}
 {activeTab === 'notifications' && (
 <div className="space-y-6">
 <div>
 <h3 className="text-lg font-semibold text-foreground mb-4">{t('projects.settings.notificationPreferences') || 'Notification Preferences'}</h3>
 <div className="space-y-4">
 <label className="flex items-center justify-between p-4 bg-background border border-border rounded-lg">
 <div>
 <p className="font-medium text-foreground">{t('projects.settings.emailNotifications') || 'Email Notifications'}</p>
 <p className="text-sm text-muted-foreground">{t('projects.settings.emailDescription') || 'Receive updates via email'}</p>
 </div>
 <input
 type="checkbox"
 checked={settings.notifications.email}
 onChange={(e) => setSettings(prev => ({
 ...prev,
 notifications: { ...prev.notifications, email: e.target.checked }
 }))}
 className="w-5 h-5 text-brand rounded focus:ring-ring"
 />
 </label>
 <label className="flex items-center justify-between p-4 bg-background border border-border rounded-lg">
 <div>
 <p className="font-medium text-foreground">{t('projects.settings.slackNotifications') || 'Slack Notifications'}</p>
 <p className="text-sm text-muted-foreground">{t('projects.settings.slackDescription') || 'Send updates to Slack channel'}</p>
 </div>
 <input
 type="checkbox"
 checked={settings.notifications.slack}
 onChange={(e) => setSettings(prev => ({
 ...prev,
 notifications: { ...prev.notifications, slack: e.target.checked }
 }))}
 className="w-5 h-5 text-brand rounded focus:ring-ring"
 />
 </label>
 <label className="flex items-center justify-between p-4 bg-background border border-border rounded-lg">
 <div>
 <p className="font-medium text-foreground">{t('projects.settings.inAppNotifications') || 'In-App Notifications'}</p>
 <p className="text-sm text-muted-foreground">{t('projects.settings.inAppDescription') || 'Show notifications in the app'}</p>
 </div>
 <input
 type="checkbox"
 checked={settings.notifications.inApp}
 onChange={(e) => setSettings(prev => ({
 ...prev,
 notifications: { ...prev.notifications, inApp: e.target.checked }
 }))}
 className="w-5 h-5 text-brand rounded focus:ring-ring"
 />
 </label>
 </div>
 </div>
 </div>
 )}

 {/* Labels */}
 {activeTab === 'labels' && (
 <div className="space-y-6">
 <div>
 <h3 className="text-lg font-semibold text-foreground mb-1">Labels</h3>
 <p className="text-sm text-muted-foreground mb-6">Create and manage labels to categorize tasks in this project.</p>

 {/* Create new label */}
 <div className="p-4 bg-background border border-border rounded-xl mb-6">
 <h4 className="text-sm font-medium text-foreground mb-3">Create new label</h4>
 <div className="flex items-center gap-3">
 <input
 type="color"
 value={newLabelColor}
 onChange={(e) => setNewLabelColor(e.target.value)}
 className="w-10 h-10 rounded border border-border cursor-pointer p-0.5"
 title="Pick color"
 />
 <input
 type="text"
 value={newLabelName}
 onChange={(e) => setNewLabelName(e.target.value)}
 onKeyDown={(e) => e.key === 'Enter' && handleCreateLabel()}
 placeholder="Label name..."
 className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-sm"
 />
 <button
 onClick={handleCreateLabel}
 disabled={!newLabelName.trim() || isCreatingLabel}
 className="flex items-center gap-1.5 px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand-strong disabled:opacity-50 text-sm"
 >
 <Plus className="h-4 w-4" />
 {isCreatingLabel ? 'Creating...' : 'Create'}
 </button>
 </div>
 </div>

 {/* Labels list */}
 <div className="space-y-2">
 {labels.length === 0 && (
 <p className="text-sm text-muted-foreground text-center py-8">No labels yet. Create one above.</p>
 )}
 {labels.map((label) => (
 <div key={label._id} className="flex items-center gap-3 p-3 bg-background border border-border rounded-lg">
 {editingLabel?._id === label._id ? (
 <>
 <input
 type="color"
 value={editLabelColor}
 onChange={(e) => setEditLabelColor(e.target.value)}
 className="w-8 h-8 rounded border border-border cursor-pointer p-0.5"
 />
 <input
 type="text"
 value={editLabelName}
 onChange={(e) => setEditLabelName(e.target.value)}
 onKeyDown={(e) => { if (e.key === 'Enter') handleUpdateLabel(); if (e.key === 'Escape') setEditingLabel(null); }}
 className="flex-1 px-3 py-1.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-sm"
 autoFocus
 />
 <button onClick={handleUpdateLabel} className="p-1.5 text-success hover:bg-success-soft rounded">
 <Check className="h-4 w-4" />
 </button>
 <button onClick={() => setEditingLabel(null)} className="p-1.5 text-muted-foreground hover:bg-muted rounded">
 <X className="h-4 w-4" />
 </button>
 </>
 ) : (
 <>
 <span className="w-5 h-5 rounded-full shrink-0" style={{ backgroundColor: label.color }} />
 <span className="flex-1 text-sm font-medium text-foreground">{label.name}</span>
 <button
 onClick={() => { setEditingLabel(label); setEditLabelName(label.name); setEditLabelColor(label.color); }}
 className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded"
 >
 <Edit3 className="h-4 w-4" />
 </button>
 <button
 onClick={() => handleDeleteLabel(label._id)}
 className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive-soft rounded"
 >
 <Trash2 className="h-4 w-4" />
 </button>
 </>
 )}
 </div>
 ))}
 </div>
 </div>
 </div>
 )}

 {/* Custom Fields */}
 {activeTab === 'customFields' && (
 <div className="space-y-6">
 <div>
 <h3 className="text-lg font-semibold text-foreground mb-1">Custom Fields</h3>
 <p className="text-sm text-muted-foreground mb-6">Define custom fields that appear on tasks in this project.</p>

 {isLoadingFields ? (
 <div className="text-center py-8 text-muted-foreground">Loading...</div>
 ) : (
 <>
 {/* Create new field button */}
 {!showFieldForm && (
 <div className="mb-6">
 <button
 onClick={() => { resetFieldForm(); setShowFieldForm(true); }}
 className="flex items-center gap-1.5 px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand-strong text-sm"
 >
 <Plus className="h-4 w-4" />
 Add Field
 </button>
 </div>
 )}

 {/* Create/Edit form */}
 {showFieldForm && (
 <div className="p-4 bg-background border border-brand-border rounded-xl mb-6 space-y-3">
 <h4 className="text-sm font-medium text-foreground">{editingFieldId ? 'Edit Field' : 'Create new field'}</h4>
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="text-xs font-medium text-muted-foreground mb-1 block">Machine ID</label>
 <input
 type="text"
 value={fieldForm.id}
 onChange={(e) => setFieldForm(prev => ({ ...prev, id: e.target.value.replace(/[^a-z0-9_]/g, '') }))}
 disabled={!!editingFieldId}
 placeholder="e.g. mobile_number"
 className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
 />
 </div>
 <div>
 <label className="text-xs font-medium text-muted-foreground mb-1 block">Display Label</label>
 <input
 type="text"
 value={fieldForm.name}
 onChange={(e) => setFieldForm(prev => ({ ...prev, name: e.target.value }))}
 placeholder="e.g. Mobile Number"
 className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
 />
 </div>
 <div>
 <label className="text-xs font-medium text-muted-foreground mb-1 block">Type</label>
 <select
 value={fieldForm.type}
 onChange={(e) => setFieldForm(prev => ({ ...prev, type: e.target.value as TaskCustomFieldType, options: [] }))}
 disabled={!!editingFieldId}
 className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
 >
 {ALLOWED_FIELD_TYPES.map(ft => (
 <option key={ft} value={ft}>{FIELD_TYPE_LABELS[ft]}</option>
 ))}
 </select>
 </div>
 <div className="flex items-end gap-2 pb-1">
 <label className="flex items-center gap-2 text-sm cursor-pointer">
 <input
 type="checkbox"
 checked={fieldForm.required}
 onChange={(e) => setFieldForm(prev => ({ ...prev, required: e.target.checked }))}
 className="rounded border-border"
 />
 <span className="text-foreground">Required</span>
 </label>
 </div>
 </div>

 {fieldForm.type === 'select' && (
 <div>
 <label className="text-xs font-medium text-muted-foreground mb-1 block">Options</label>
 <div className="flex flex-wrap gap-1.5 mb-2">
 {fieldForm.options.map(opt => (
 <span key={opt} className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-muted text-foreground">
 {opt}
 <button onClick={() => removeFieldOption(opt)} className="hover:text-destructive"><X className="h-3 w-3" /></button>
 </span>
 ))}
 </div>
 <div className="flex gap-2">
 <input
 type="text"
 value={newFieldOption}
 onChange={(e) => setNewFieldOption(e.target.value)}
 onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFieldOption())}
 placeholder="Add option..."
 className="flex-1 px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
 />
 <button onClick={addFieldOption} className="px-3 py-2 text-sm rounded-lg bg-muted hover:bg-muted/80 text-foreground transition-colors">Add</button>
 </div>
 </div>
 )}

 <div>
 <label className="text-xs font-medium text-muted-foreground mb-1 block">Default Value (optional)</label>
 <input
 type="text"
 value={fieldForm.defaultValue}
 onChange={(e) => setFieldForm(prev => ({ ...prev, defaultValue: e.target.value }))}
 placeholder="Leave empty for no default"
 className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
 />
 </div>

 <div className="flex justify-end gap-2 pt-2">
 <button onClick={resetFieldForm} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted text-foreground transition-colors">Cancel</button>
 <button
 onClick={handleSaveField}
 disabled={isSavingField}
 className="px-4 py-2 text-sm rounded-lg bg-brand text-brand-foreground hover:bg-brand-strong transition-colors disabled:opacity-50"
 >
 {isSavingField ? 'Saving...' : editingFieldId ? 'Update' : 'Create'}
 </button>
 </div>
 </div>
 )}

 {/* Fields list */}
 <div className="space-y-2">
 {customFields.length === 0 && !showFieldForm && (
 <p className="text-sm text-muted-foreground text-center py-8">No custom fields yet. Click &quot;Add Field&quot; to create one.</p>
 )}
 {customFields.map((field) => (
 <div key={field.id} className="flex items-center gap-3 p-3 bg-background border border-border rounded-lg group">
 <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 cursor-grab" />
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2">
 <span className="font-medium text-foreground text-sm">{field.name}</span>
 <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{FIELD_TYPE_LABELS[field.type]}</span>
 {field.required && <span className="text-xs px-1.5 py-0.5 rounded bg-destructive-soft text-destructive">Required</span>}
 </div>
 <div className="text-xs text-muted-foreground mt-0.5">
 ID: {field.id}
 {field.options && field.options.length > 0 && <span className="ml-2">Options: {field.options.join(', ')}</span>}
 </div>
 </div>
 <button
 onClick={() => startEditField(field)}
 className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded opacity-0 group-hover:opacity-100 transition-opacity"
 title="Edit"
 >
 <Pencil className="h-4 w-4" />
 </button>
 <button
 onClick={() => handleArchiveField(field.id)}
 className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive-soft rounded opacity-0 group-hover:opacity-100 transition-opacity"
 title="Archive"
 >
 <Archive className="h-4 w-4" />
 </button>
 </div>
 ))}
 </div>
 </>
 )}
 </div>
 </div>
 )}

 {/* Danger Zone */}
 {activeTab === 'danger' && (
 <div className="space-y-6">
 <div className="p-6 bg-destructive-soft border border-destructive/30 rounded-xl">
 <h3 className="text-lg font-semibold text-destructive mb-2">{t('projects.settings.dangerZone') || 'Danger Zone'}</h3>
 <p className="text-sm text-destructive mb-4">
 {t('projects.settings.dangerWarning') || 'These actions are irreversible. Please proceed with caution.'}
 </p>
 <div className="space-y-4">
 <div className="flex items-center justify-between p-4 bg-background border border-destructive/30 rounded-lg">
 <div>
 <p className="font-medium text-foreground">{t('projects.settings.archiveProject') || 'Archive Project'}</p>
 <p className="text-sm text-muted-foreground">{t('projects.settings.archiveDescription') || 'Hide project from active list'}</p>
 </div>
 <button className="px-4 py-2 text-destructive border border-destructive/30 rounded-lg hover:bg-destructive-soft transition-colors">
 {t('projects.settings.archive') || 'Archive'}
 </button>
 </div>
 <div className="flex items-center justify-between p-4 bg-background border border-destructive/30 rounded-lg">
 <div>
 <p className="font-medium text-foreground">{t('projects.settings.deleteProject') || 'Delete Project'}</p>
 <p className="text-sm text-muted-foreground">{t('projects.settings.deleteDescription') || 'Permanently delete this project and all data'}</p>
 </div>
 <button className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors">
 {t('projects.common.delete') || 'Delete'}
 </button>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* Members */}
 {activeTab === 'members' && (
 <ProjectMembersPanel projectId={projectId} />
 )}

 {/* Teams */}
 {activeTab === 'teams' && (
 <ProjectTeamsPanel projectId={projectId} />
 )}

 {/* Permissions */}
 {activeTab === 'permissions' && (
 <div className="space-y-6">
 <div>
 <h3 className="text-lg font-semibold text-foreground mb-4">{t('projects.settings.accessPermissions') || 'Access Permissions'}</h3>
 <div className="space-y-4">
 <label className="flex items-center justify-between p-4 bg-background border border-border rounded-lg">
 <div>
 <p className="font-medium text-foreground">{t('projects.settings.allowGuestAccess') || 'Allow Guest Access'}</p>
 <p className="text-sm text-muted-foreground">{t('projects.settings.guestAccessDescription') || 'Let external users view the project'}</p>
 </div>
 <input
 type="checkbox"
 checked={settings.permissions.allowGuestAccess}
 onChange={(e) => setSettings(prev => ({
 ...prev,
 permissions: { ...prev.permissions, allowGuestAccess: e.target.checked }
 }))}
 className="w-5 h-5 text-brand rounded focus:ring-ring"
 />
 </label>
 <label className="flex items-center justify-between p-4 bg-background border border-border rounded-lg">
 <div>
 <p className="font-medium text-foreground">{t('projects.settings.requireApproval') || 'Require Approval'}</p>
 <p className="text-sm text-muted-foreground">{t('projects.settings.approvalDescription') || 'New members need approval to join'}</p>
 </div>
 <input
 type="checkbox"
 checked={settings.permissions.requireApproval}
 onChange={(e) => setSettings(prev => ({
 ...prev,
 permissions: { ...prev.permissions, requireApproval: e.target.checked }
 }))}
 className="w-5 h-5 text-brand rounded focus:ring-ring"
 />
 </label>
 </div>
 </div>
 </div>
 )}

 {/* Workflows */}
 {activeTab === 'workflows' && (
 <WorkflowSettingsPanel projectId={projectId} />
 )}

 {/* Appearance */}
 {activeTab === 'appearance' && (
 <div className="space-y-6">
 <div>
 <h3 className="text-lg font-semibold text-foreground mb-4">{t('projects.settings.appearance') || 'Appearance'}</h3>
 <p className="text-sm text-muted-foreground">{t('projects.settings.appearanceDescription') || 'Customize how your project looks.'}</p>
 </div>
 </div>
 )}

 {/* Save Button */}
 {activeTab !== 'danger' && activeTab !== 'labels' && activeTab !== 'customFields' && activeTab !== 'members' && activeTab !== 'teams' && activeTab !== 'workflows' && (
 <div className="mt-8 pt-6 border-t border-border">
 <button
 onClick={handleSave}
 disabled={isSaving}
 className="flex items-center gap-2 px-6 py-2.5 bg-brand text-brand-foreground rounded-lg hover:bg-brand-strong transition-colors disabled:opacity-50"
 >
 <Save className="h-4 w-4" />
 {isSaving ? t('projects.settings.saving') || 'Saving...' : t('projects.settings.saveChanges') || 'Save Changes'}
 </button>
 </div>
 )}
 </div>
 </div>
 </div>
 </div>
 );
}
