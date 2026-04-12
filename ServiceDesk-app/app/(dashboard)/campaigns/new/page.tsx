'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
 ArrowLeft,
 Megaphone,
 Mail,
 MessageSquare,
 Bell,
 Save,
} from 'lucide-react';
import { useCreateCampaign, useTemplates, useSegments } from '@/hooks/useCampaigns';

export default function NewCampaignPage() {
 const router = useRouter();
 const createMutation = useCreateCampaign();
 const { data: templateData } = useTemplates({ limit: 100 });
 const { data: segmentData } = useSegments({ limit: 100 });

 const templates = templateData?.items || [];
 const segments = segmentData?.items || [];

 const [form, setForm] = useState({
 name: '',
 nameAr: '',
 description: '',
 channel: 'email',
 mode: 'one-time',
 templateId: '',
 segmentId: '',
 subject: '',
 body: '',
 bodyHtml: '',
 ctaLabel: '',
 ctaUrl: '',
 tags: '',
 });

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 try {
 await createMutation.mutateAsync({
 name: form.name,
 nameAr: form.nameAr || undefined,
 description: form.description || undefined,
 channel: form.channel,
 mode: form.mode,
 templateId: form.templateId || undefined,
 segmentId: form.segmentId || undefined,
 subject: form.subject || undefined,
 body: form.body || undefined,
 bodyHtml: form.bodyHtml || undefined,
 ctaLabel: form.ctaLabel || undefined,
 ctaUrl: form.ctaUrl || undefined,
 tags: form.tags ? form.tags.split(',').map((t) => t.trim()) : [],
 });
 router.push('/campaigns');
 } catch {
 // error handled by mutation
 }
 };

 const channelOptions = [
 { value: 'email', label: 'Email', icon: <Mail className="h-5 w-5" /> },
 { value: 'sms', label: 'SMS', icon: <MessageSquare className="h-5 w-5" /> },
 { value: 'push', label: 'Push', icon: <Bell className="h-5 w-5" /> },
 ];

 return (
 <div className="flex flex-col h-full bg-background">
 <div className="bg-card border-b border-border px-6 py-4">
 <div className="flex items-center gap-3">
 <button onClick={() => router.push('/campaigns')} className="p-1.5 rounded-lg hover:bg-accent">
 <ArrowLeft className="h-5 w-5" />
 </button>
 <Megaphone className="h-6 w-6 text-brand" />
 <h1 className="text-xl font-bold text-foreground">Create Campaign</h1>
 </div>
 </div>

 <div className="flex-1 overflow-y-auto p-6">
 <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
 {/* Basic Info */}
 <div className="bg-card rounded-xl border border-border p-6 space-y-4">
 <h2 className="text-lg font-semibold">Basic Information</h2>
 <div>
 <label className="block text-sm font-medium mb-1">Campaign Name *</label>
 <input
 type="text"
 required
 value={form.name}
 onChange={(e) => setForm({ ...form, name: e.target.value })}
 className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
 placeholder="e.g. Welcome Email Series"
 />
 </div>
 <div>
 <label className="block text-sm font-medium mb-1">Name (Arabic)</label>
 <input
 type="text"
 value={form.nameAr}
 onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
 className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
 dir="rtl"
 />
 </div>
 <div>
 <label className="block text-sm font-medium mb-1">Description</label>
 <textarea
 value={form.description}
 onChange={(e) => setForm({ ...form, description: e.target.value })}
 rows={3}
 className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
 />
 </div>
 </div>

 {/* Channel & Mode */}
 <div className="bg-card rounded-xl border border-border p-6 space-y-4">
 <h2 className="text-lg font-semibold">Channel & Mode</h2>
 <div>
 <label className="block text-sm font-medium mb-2">Channel *</label>
 <div className="grid grid-cols-3 gap-3">
 {channelOptions.map((ch) => (
 <button
 key={ch.value}
 type="button"
 onClick={() => setForm({ ...form, channel: ch.value })}
 className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-colors ${
 form.channel === ch.value
 ? 'border-brand bg-brand-surface text-brand'
 : 'border-border hover:bg-accent'
 }`}
 >
 {ch.icon}
 {ch.label}
 </button>
 ))}
 </div>
 </div>
 <div>
 <label className="block text-sm font-medium mb-1">Mode</label>
 <select
 value={form.mode}
 onChange={(e) => setForm({ ...form, mode: e.target.value })}
 className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background"
 >
 <option value="one-time">One-time</option>
 <option value="recurring">Recurring</option>
 <option value="triggered">Triggered</option>
 </select>
 </div>
 </div>

 {/* Template & Segment */}
 <div className="bg-card rounded-xl border border-border p-6 space-y-4">
 <h2 className="text-lg font-semibold">Content & Audience</h2>
 <div>
 <label className="block text-sm font-medium mb-1">Template</label>
 <select
 value={form.templateId}
 onChange={(e) => setForm({ ...form, templateId: e.target.value })}
 className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background"
 >
 <option value="">None (custom content)</option>
 {templates.map((t) => (
 <option key={t._id} value={t._id}>{t.name} ({t.channel})</option>
 ))}
 </select>
 </div>
 <div>
 <label className="block text-sm font-medium mb-1">Audience Segment</label>
 <select
 value={form.segmentId}
 onChange={(e) => setForm({ ...form, segmentId: e.target.value })}
 className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background"
 >
 <option value="">All users</option>
 {segments.map((s) => (
 <option key={s._id} value={s._id}>{s.name}</option>
 ))}
 </select>
 </div>
 {!form.templateId && (
 <>
 {form.channel === 'email' && (
 <div>
 <label className="block text-sm font-medium mb-1">Subject Line</label>
 <input
 type="text"
 value={form.subject}
 onChange={(e) => setForm({ ...form, subject: e.target.value })}
 className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
 />
 </div>
 )}
 <div>
 <label className="block text-sm font-medium mb-1">Body</label>
 <textarea
 value={form.body}
 onChange={(e) => setForm({ ...form, body: e.target.value })}
 rows={6}
 className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
 placeholder="Use {{variable}} for personalization"
 />
 </div>
 </>
 )}
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium mb-1">CTA Label</label>
 <input
 type="text"
 value={form.ctaLabel}
 onChange={(e) => setForm({ ...form, ctaLabel: e.target.value })}
 className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background"
 placeholder="e.g. Learn More"
 />
 </div>
 <div>
 <label className="block text-sm font-medium mb-1">CTA URL</label>
 <input
 type="url"
 value={form.ctaUrl}
 onChange={(e) => setForm({ ...form, ctaUrl: e.target.value })}
 className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background"
 placeholder="https://"
 />
 </div>
 </div>
 </div>

 {/* Tags */}
 <div className="bg-card rounded-xl border border-border p-6">
 <label className="block text-sm font-medium mb-1">Tags (comma-separated)</label>
 <input
 type="text"
 value={form.tags}
 onChange={(e) => setForm({ ...form, tags: e.target.value })}
 className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background"
 placeholder="e.g. welcome, onboarding"
 />
 </div>

 {/* Submit */}
 <div className="flex justify-end gap-3">
 <button
 type="button"
 onClick={() => router.push('/campaigns')}
 className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-accent transition-colors"
 >
 Cancel
 </button>
 <button
 type="submit"
 disabled={createMutation.isPending}
 className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-brand-foreground bg-brand rounded-lg hover:bg-brand-strong transition-colors disabled:opacity-50"
 >
 <Save className="h-4 w-4" />
 {createMutation.isPending ? 'Creating...' : 'Create Campaign'}
 </button>
 </div>
 </form>
 </div>
 </div>
 );
}
