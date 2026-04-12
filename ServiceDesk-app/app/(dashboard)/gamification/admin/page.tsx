'use client';

import { useState } from 'react';
import {
 Settings,
 ListOrdered,
 Award,
 Sprout,
 FileText,
 ArrowLeft,
 Plus,
 Trash2,
 ToggleLeft,
 ToggleRight,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useLocale } from '@/hooks/useLocale';
import {
 useGamificationRules,
 useCreateRule,
 useUpdateRule,
 useDeleteRule,
 useGamificationAchievementDefs,
 useCreateAchievementDef,
 useOrgGamificationConfig,
 useUpdateOrgGamificationConfig,
 useGrowthStates,
 useGamificationAuditLog,
} from '@/hooks/useGamification';
import Link from 'next/link';

const adminTabs = [
 { key: 'rules', label: 'Rules', labelAr: 'القواعد', icon: ListOrdered },
 { key: 'achievements', label: 'Achievements', labelAr: 'الإنجازات', icon: Award },
 { key: 'growth', label: 'Growth States', labelAr: 'حالات النمو', icon: Sprout },
 { key: 'config', label: 'Settings', labelAr: 'الإعدادات', icon: Settings },
 { key: 'audit', label: 'Audit Log', labelAr: 'سجل المراجعة', icon: FileText },
] as const;

type AdminTab = typeof adminTabs[number]['key'];

export default function GamificationAdminPage() {
 const { locale } = useLocale();
 const isAr = locale === 'ar';
 const [tab, setTab] = useState<AdminTab>('rules');

 return (
 <DashboardLayout>
 <div className="space-y-6">
 {/* Header */}
 <div className="flex items-center gap-3">
 <Link href="/gamification" className="p-2 rounded-lg hover:bg-muted transition-colors">
 <ArrowLeft className="w-5 h-5 text-muted-foreground" />
 </Link>
 <div>
 <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
 <Settings className="w-6 h-6 text-muted-foreground" />
 {isAr ? 'إدارة التلعيب' : 'Gamification Admin'}
 </h1>
 </div>
 </div>

 {/* Tabs */}
 <div className="flex gap-1 bg-muted rounded-lg p-1 overflow-x-auto">
 {adminTabs.map((t) => (
 <button
 key={t.key}
 onClick={() => setTab(t.key)}
 className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
 tab === t.key
 ? 'bg-card text-foreground shadow-sm'
 : 'text-muted-foreground hover:text-foreground'
 }`}
 >
 <t.icon className="w-4 h-4" />
 {isAr ? t.labelAr : t.label}
 </button>
 ))}
 </div>

 {/* Tab Content */}
 {tab === 'rules' && <RulesTab isAr={isAr} />}
 {tab === 'achievements' && <AchievementsTab isAr={isAr} />}
 {tab === 'growth' && <GrowthTab isAr={isAr} />}
 {tab === 'config' && <ConfigTab isAr={isAr} />}
 {tab === 'audit' && <AuditTab isAr={isAr} />}
 </div>
 </DashboardLayout>
 );
}

// ── Rules Tab ────────────────────────────────────────────────

function RulesTab({ isAr }: { isAr: boolean }) {
 const { data, isLoading } = useGamificationRules();
 const createRule = useCreateRule();
 const updateRule = useUpdateRule();
 const deleteRule = useDeleteRule();
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 const rules = ((data as any)?.data || []) as any[];

 return (
 <div className="bg-card rounded-xl border">
 <div className="flex items-center justify-between p-5 border-b">
 <h2 className="font-semibold">{isAr ? 'قواعد النقاط' : 'Point Rules'}</h2>
 <button
 onClick={() =>
 createRule.mutate({
 code: `rule_${Date.now()}`,
 name: 'New Rule',
 trigger: 'pm.work_item.transitioned',
 conditions: [],
 effect: 'base',
 pointsDelta: 10,
 enabled: true,
 priority: 0,
 })
 }
 className="flex items-center gap-1.5 px-3 py-1.5 bg-brand text-brand-foreground rounded-lg text-xs font-medium hover:opacity-90"
 >
 <Plus className="w-3.5 h-3.5" />
 {isAr ? 'إضافة' : 'Add Rule'}
 </button>
 </div>
 {isLoading ? (
 <div className="p-8 text-center text-sm text-muted-foreground">{isAr ? 'جارٍ التحميل...' : 'Loading...'}</div>
 ) : (
 <div className="divide-y">
 {rules.map((rule) => (
 <div key={rule._id} className="flex items-center justify-between px-5 py-3">
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2">
 <p className="text-sm font-medium text-foreground">{rule.name}</p>
 <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
 rule.enabled ? 'bg-success-soft text-success' : 'bg-muted text-muted-foreground'
 }`}>
 {rule.enabled ? (isAr ? 'مفعّل' : 'Active') : (isAr ? 'معطّل' : 'Disabled')}
 </span>
 </div>
 <p className="text-xs text-muted-foreground">
 {rule.trigger} &middot; {rule.effect} &middot; {rule.pointsDelta > 0 ? '+' : ''}{rule.pointsDelta} pts
 </p>
 </div>
 <div className="flex items-center gap-1">
 <button
 onClick={() => updateRule.mutate({ id: rule._id, data: { enabled: !rule.enabled } })}
 className="p-1.5 rounded hover:bg-muted"
 >
 {rule.enabled ? <ToggleRight className="w-4 h-4 text-success" /> : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
 </button>
 <button
 onClick={() => deleteRule.mutate(rule._id)}
 className="p-1.5 rounded hover:bg-destructive-soft text-destructive"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 </div>
 ))}
 {rules.length === 0 && (
 <div className="p-8 text-center text-sm text-muted-foreground">
 {isAr ? 'لا توجد قواعد بعد' : 'No rules configured'}
 </div>
 )}
 </div>
 )}
 </div>
 );
}

// ── Achievements Tab ─────────────────────────────────────────

function AchievementsTab({ isAr }: { isAr: boolean }) {
 const { data, isLoading } = useGamificationAchievementDefs();
 const createDef = useCreateAchievementDef();
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 const defs = ((data as any)?.data || []) as any[];

 return (
 <div className="bg-card rounded-xl border">
 <div className="flex items-center justify-between p-5 border-b">
 <h2 className="font-semibold">{isAr ? 'تعريفات الإنجازات' : 'Achievement Definitions'}</h2>
 <button
 onClick={() =>
 createDef.mutate({
 code: `ach_${Date.now()}`,
 name: 'New Achievement',
 category: 'milestone',
 conditions: [{ type: 'total_points', operator: 'gte', value: 100 }],
 icon: '🏆',
 hidden: false,
 repeatable: false,
 })
 }
 className="flex items-center gap-1.5 px-3 py-1.5 bg-brand text-brand-foreground rounded-lg text-xs font-medium hover:opacity-90"
 >
 <Plus className="w-3.5 h-3.5" />
 {isAr ? 'إضافة' : 'Add'}
 </button>
 </div>
 {isLoading ? (
 <div className="p-8 text-center text-sm text-muted-foreground">{isAr ? 'جارٍ التحميل...' : 'Loading...'}</div>
 ) : (
 <div className="divide-y">
 {defs.map((d) => (
 <div key={d._id} className="flex items-center gap-3 px-5 py-3">
 <span className="text-xl">{d.icon || '🏆'}</span>
 <div className="flex-1 min-w-0">
 <p className="text-sm font-medium text-foreground">{d.name}</p>
 <p className="text-xs text-muted-foreground">{d.category} &middot; {d.code}</p>
 </div>
 <div className="flex items-center gap-1">
 {d.hidden && (
 <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">
 {isAr ? 'مخفي' : 'Hidden'}
 </span>
 )}
 </div>
 </div>
 ))}
 {defs.length === 0 && (
 <div className="p-8 text-center text-sm text-muted-foreground">
 {isAr ? 'لا توجد إنجازات معرّفة' : 'No achievements defined'}
 </div>
 )}
 </div>
 )}
 </div>
 );
}

// ── Growth States Tab ────────────────────────────────────────

function GrowthTab({ isAr }: { isAr: boolean }) {
 const { data, isLoading } = useGrowthStates();
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 const states = ((data as any)?.data || []) as any[];

 return (
 <div className="bg-card rounded-xl border">
 <div className="p-5 border-b">
 <h2 className="font-semibold">{isAr ? 'حالات النمو' : 'Growth States'}</h2>
 <p className="text-xs text-muted-foreground mt-0.5">
 {isAr ? 'مستويات التقدم المرئية بناءً على النقاط والمستوى' : 'Visual progression tiers based on points and level thresholds'}
 </p>
 </div>
 {isLoading ? (
 <div className="p-8 text-center text-sm text-muted-foreground">{isAr ? 'جارٍ التحميل...' : 'Loading...'}</div>
 ) : (
 <div className="divide-y">
 {states.map((s) => (
 <div key={s.state || s._id} className="flex items-center gap-4 px-5 py-4">
 <span className="text-2xl">{s.icon || '🌱'}</span>
 <div className="flex-1">
 <p className="text-sm font-medium text-foreground">{isAr ? s.labelAr || s.label : s.label}</p>
 <p className="text-xs text-muted-foreground">
 {isAr ? 'الحد الأدنى للنقاط:' : 'Min points:'} {s.minPoints} &middot; {isAr ? 'الحد الأدنى للمستوى:' : 'Min level:'} {s.minLevel}
 </p>
 </div>
 </div>
 ))}
 {states.length === 0 && (
 <div className="p-8 text-center text-sm text-muted-foreground">
 {isAr ? 'لم يتم تكوين حالات النمو بعد' : 'Growth states not configured yet'}
 </div>
 )}
 </div>
 )}
 </div>
 );
}

// ── Config Tab ───────────────────────────────────────────────

function ConfigTab({ isAr }: { isAr: boolean }) {
 const { data, isLoading } = useOrgGamificationConfig();
 const updateConfig = useUpdateOrgGamificationConfig();
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 const config = (data as any)?.data;

 function toggle(field: string) {
 if (!config) return;
 updateConfig.mutate({ [field]: !config[field] });
 }

 const toggles = [
 { key: 'pointsEnabled', label: 'Points System', labelAr: 'نظام النقاط' },
 { key: 'streaksEnabled', label: 'Streaks', labelAr: 'السلاسل' },
 { key: 'leaderboardEnabled', label: 'Leaderboard', labelAr: 'لوحة المتصدرين' },
 { key: 'achievementsEnabled', label: 'Achievements', labelAr: 'الإنجازات' },
 { key: 'celebrationsEnabled', label: 'Celebrations', labelAr: 'الاحتفالات' },
 ];

 return (
 <div className="bg-card rounded-xl border">
 <div className="p-5 border-b">
 <h2 className="font-semibold">{isAr ? 'إعدادات المؤسسة' : 'Organization Settings'}</h2>
 </div>
 {isLoading || !config ? (
 <div className="p-8 text-center text-sm text-muted-foreground">{isAr ? 'جارٍ التحميل...' : 'Loading...'}</div>
 ) : (
 <div className="divide-y">
 {toggles.map((t) => (
 <div key={t.key} className="flex items-center justify-between px-5 py-3.5">
 <span className="text-sm font-medium text-foreground">{isAr ? t.labelAr : t.label}</span>
 <button onClick={() => toggle(t.key)} className="p-1">
 {config[t.key] ? (
 <ToggleRight className="w-6 h-6 text-success" />
 ) : (
 <ToggleLeft className="w-6 h-6 text-muted-foreground" />
 )}
 </button>
 </div>
 ))}
 <div className="px-5 py-4 space-y-3">
 <div className="flex items-center justify-between">
 <span className="text-sm text-muted-foreground">{isAr ? 'حد النقاط اليومي' : 'Daily Points Cap'}</span>
 <span className="text-sm font-medium">{config.dailyPointsCap}</span>
 </div>
 <div className="flex items-center justify-between">
 <span className="text-sm text-muted-foreground">{isAr ? 'المنطقة الزمنية' : 'Timezone'}</span>
 <span className="text-sm font-medium">{config.timezone}</span>
 </div>
 <div className="flex items-center justify-between">
 <span className="text-sm text-muted-foreground">{isAr ? 'ساعة قطع السلسلة' : 'Streak Cutoff Hour'}</span>
 <span className="text-sm font-medium">{config.streakCutoffHour}:00</span>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}

// ── Audit Log Tab ────────────────────────────────────────────

function AuditTab({ isAr }: { isAr: boolean }) {
 const [page] = useState(1);
 const { data, isLoading } = useGamificationAuditLog({ page: String(page), limit: '20' });
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 const resp = data as any;
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 const logs = (resp?.data?.data || resp?.data || []) as any[];

 return (
 <div className="bg-card rounded-xl border">
 <div className="p-5 border-b">
 <h2 className="font-semibold">{isAr ? 'سجل المراجعة' : 'Audit Log'}</h2>
 </div>
 {isLoading ? (
 <div className="p-8 text-center text-sm text-muted-foreground">{isAr ? 'جارٍ التحميل...' : 'Loading...'}</div>
 ) : (
 <div className="divide-y">
 {logs.map((log) => (
 <div key={log._id} className="px-5 py-3">
 <div className="flex items-center justify-between">
 <p className="text-sm font-medium text-foreground">{log.action}</p>
 <p className="text-xs text-muted-foreground">
 {log.createdAt ? new Date(log.createdAt).toLocaleString() : ''}
 </p>
 </div>
 <p className="text-xs text-muted-foreground mt-0.5">
 {log.entity} &middot; {log.performedBy}
 </p>
 </div>
 ))}
 {logs.length === 0 && (
 <div className="p-8 text-center text-sm text-muted-foreground">
 {isAr ? 'لا توجد سجلات' : 'No audit entries yet'}
 </div>
 )}
 </div>
 )}
 </div>
 );
}
