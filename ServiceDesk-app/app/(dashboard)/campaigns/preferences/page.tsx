'use client';

import { useRouter } from 'next/navigation';
import {
 Settings,
 ArrowLeft,
 Mail,
 MessageSquare,
 Bell,
} from 'lucide-react';
import { useMyPreferences, useUpdateMyPreferences, IUserPreference } from '@/hooks/useCampaigns';

type ToggleField = keyof Pick<
 IUserPreference,
 'emailEnabled' | 'smsEnabled' | 'pushEnabled' | 'marketingEnabled' | 'transactionalEnabled' | 'remindersEnabled' | 'productUpdatesEnabled' | 'quietHoursEnabled'
>;

export default function PreferencesPage() {
 const router = useRouter();
 const { data: preferences, isLoading } = useMyPreferences();
 const updateMutation = useUpdateMyPreferences();

 const toggle = (field: ToggleField) => {
 updateMutation.mutate({ [field]: !(preferences?.[field] ?? true) });
 };

 const channelToggles: { key: ToggleField; label: string; icon: React.ReactNode }[] = [
 { key: 'emailEnabled', label: 'Email Notifications', icon: <Mail className="h-5 w-5 text-brand" /> },
 { key: 'smsEnabled', label: 'SMS Notifications', icon: <MessageSquare className="h-5 w-5 text-success" /> },
 { key: 'pushEnabled', label: 'Push Notifications', icon: <Bell className="h-5 w-5 text-info" /> },
 ];

 const categoryToggles: { key: ToggleField; label: string }[] = [
 { key: 'marketingEnabled', label: 'Marketing' },
 { key: 'transactionalEnabled', label: 'Transactional' },
 { key: 'remindersEnabled', label: 'Reminders' },
 { key: 'productUpdatesEnabled', label: 'Product Updates' },
 ];

 if (isLoading) {
 return (
 <div className="flex items-center justify-center h-64">
 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
 </div>
 );
 }

 return (
 <div className="flex flex-col h-full bg-background">
 <div className="bg-card border-b border-border px-6 py-4">
 <div className="flex items-center gap-3">
 <button onClick={() => router.push('/campaigns')} className="p-1.5 rounded-lg hover:bg-accent">
 <ArrowLeft className="h-5 w-5" />
 </button>
 <Settings className="h-6 w-6 text-brand" />
 <h1 className="text-xl font-bold text-foreground">Notification Preferences</h1>
 </div>
 </div>

 <div className="flex-1 overflow-y-auto p-6">
 <div className="max-w-2xl mx-auto space-y-6">
 {/* Channel Toggles */}
 <div className="bg-card rounded-xl border border-border p-6">
 <h2 className="font-semibold text-foreground mb-4">Channels</h2>
 <div className="space-y-4">
 {channelToggles.map((ch) => (
 <div key={ch.key} className="flex items-center justify-between py-2">
 <div className="flex items-center gap-3">
 {ch.icon}
 <span className="text-sm font-medium">{ch.label}</span>
 </div>
 <button
 onClick={() => toggle(ch.key)}
 disabled={updateMutation.isPending}
 className={`w-10 h-5 rounded-full transition-colors relative ${
 preferences?.[ch.key] !== false ? 'bg-brand' : 'bg-muted'
 }`}
 >
 <span
 className={`absolute top-0.5 w-4 h-4 rounded-full bg-background shadow transition-transform ${
 preferences?.[ch.key] !== false ? 'left-5' : 'left-0.5'
 }`}
 />
 </button>
 </div>
 ))}
 </div>
 </div>

 {/* Category Toggles */}
 <div className="bg-card rounded-xl border border-border p-6">
 <h2 className="font-semibold text-foreground mb-4">Notification Categories</h2>
 <div className="space-y-4">
 {categoryToggles.map((cat) => (
 <div key={cat.key} className="flex items-center justify-between py-2">
 <span className="text-sm font-medium">{cat.label}</span>
 <button
 onClick={() => toggle(cat.key)}
 disabled={updateMutation.isPending}
 className={`w-10 h-5 rounded-full transition-colors relative ${
 preferences?.[cat.key] !== false ? 'bg-brand' : 'bg-muted'
 }`}
 >
 <span
 className={`absolute top-0.5 w-4 h-4 rounded-full bg-background shadow transition-transform ${
 preferences?.[cat.key] !== false ? 'left-5' : 'left-0.5'
 }`}
 />
 </button>
 </div>
 ))}
 </div>
 </div>

 {/* Quiet hours */}
 <div className="bg-card rounded-xl border border-border p-6">
 <div className="flex items-center justify-between mb-4">
 <h2 className="font-semibold text-foreground">Quiet Hours</h2>
 <button
 onClick={() => toggle('quietHoursEnabled')}
 disabled={updateMutation.isPending}
 className={`w-10 h-5 rounded-full transition-colors relative ${
 preferences?.quietHoursEnabled ? 'bg-brand' : 'bg-muted'
 }`}
 >
 <span
 className={`absolute top-0.5 w-4 h-4 rounded-full bg-background shadow transition-transform ${
 preferences?.quietHoursEnabled ? 'left-5' : 'left-0.5'
 }`}
 />
 </button>
 </div>
 <p className="text-sm text-muted-foreground mb-3">
 Notifications will be held and delivered after quiet hours end.
 </p>
 <div className="flex items-center gap-3">
 <div className="flex items-center gap-2">
 <label className="text-sm">From</label>
 <input
 type="time"
 defaultValue={preferences?.quietHoursFrom || '22:00'}
 onChange={(e) => updateMutation.mutate({ quietHoursFrom: e.target.value })}
 className="px-2 py-1 text-sm border border-border rounded bg-background"
 />
 </div>
 <span className="text-muted-foreground">to</span>
 <div className="flex items-center gap-2">
 <label className="text-sm">Until</label>
 <input
 type="time"
 defaultValue={preferences?.quietHoursTo || '08:00'}
 onChange={(e) => updateMutation.mutate({ quietHoursTo: e.target.value })}
 className="px-2 py-1 text-sm border border-border rounded bg-background"
 />
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
