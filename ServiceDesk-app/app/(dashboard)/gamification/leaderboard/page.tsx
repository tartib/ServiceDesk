'use client';

import { useState } from 'react';
import {
 Trophy,
 Crown,
 Medal,
 Flame,
 Users,
 ArrowLeft,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useLocale } from '@/hooks/useLocale';
import { useLeaderboard, useTeamLeaderboard } from '@/hooks/useGamification';
import Link from 'next/link';

const periods = [
 { value: 'daily', label: 'Daily', labelAr: 'يومي' },
 { value: 'weekly', label: 'Weekly', labelAr: 'أسبوعي' },
 { value: 'monthly', label: 'Monthly', labelAr: 'شهري' },
 { value: 'all_time', label: 'All Time', labelAr: 'كل الوقت' },
];

const tabs = [
 { key: 'individual', label: 'Individual', labelAr: 'فردي', icon: Crown },
 { key: 'team', label: 'Teams', labelAr: 'الفرق', icon: Users },
] as const;

export default function LeaderboardPage() {
 const { locale } = useLocale();
 const isAr = locale === 'ar';
 const [period, setPeriod] = useState('weekly');
 const [tab, setTab] = useState<'individual' | 'team'>('individual');

 const { data: indData, isLoading: indLoading } = useLeaderboard({
 period,
 scope: 'organization',
 limit: '50',
 });
 const { data: teamData, isLoading: teamLoading } = useTeamLeaderboard(period);

 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 const entries = ((indData as any)?.data || []) as any[];
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 const teamEntries = ((teamData as any)?.data || []) as any[];
 const isLoading = tab === 'individual' ? indLoading : teamLoading;

 function rankBadge(rank: number) {
 if (rank === 1) return <Crown className="w-5 h-5 text-warning" />;
 if (rank === 2) return <Medal className="w-5 h-5 text-muted-foreground" />;
 if (rank === 3) return <Medal className="w-5 h-5 text-warning" />;
 return <span className="text-sm font-semibold text-muted-foreground w-5 text-center">{rank}</span>;
 }

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
 <Trophy className="w-6 h-6 text-warning" />
 {isAr ? 'لوحة المتصدرين' : 'Leaderboard'}
 </h1>
 </div>
 </div>

 {/* Tabs + Period Filter */}
 <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
 <div className="flex bg-muted rounded-lg p-1">
 {tabs.map((t) => (
 <button
 key={t.key}
 onClick={() => setTab(t.key)}
 className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
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
 <div className="flex gap-1 bg-muted rounded-lg p-1">
 {periods.map((p) => (
 <button
 key={p.value}
 onClick={() => setPeriod(p.value)}
 className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
 period === p.value
 ? 'bg-card text-foreground shadow-sm'
 : 'text-muted-foreground hover:text-foreground'
 }`}
 >
 {isAr ? p.labelAr : p.label}
 </button>
 ))}
 </div>
 </div>

 {/* Leaderboard Table */}
 <div className="bg-card rounded-xl border overflow-hidden">
 {isLoading ? (
 <div className="space-y-0 divide-y">
 {[...Array(8)].map((_, i) => (
 <div key={i} className="h-14 animate-pulse bg-muted/30" />
 ))}
 </div>
 ) : tab === 'individual' ? (
 <div className="divide-y">
 {entries.map((entry, idx) => (
 <div
 key={entry.userId || idx}
 className={`flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/30 ${
 idx < 3 ? 'bg-warning-soft/30' : ''
 }`}
 >
 <div className="w-8 flex justify-center">{rankBadge(entry.rank || idx + 1)}</div>
 <div className="w-9 h-9 rounded-full bg-brand-surface flex items-center justify-center text-sm font-bold text-brand">
 {(entry.userName || 'U')[0].toUpperCase()}
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-sm font-medium text-foreground truncate">
 {entry.userName || entry.userId}
 </p>
 <div className="flex items-center gap-2 text-xs text-muted-foreground">
 <span>{isAr ? 'المستوى' : 'Lv.'} {entry.currentLevel}</span>
 {entry.currentStreak > 0 && (
 <span className="flex items-center gap-0.5">
 <Flame className="w-3 h-3 text-warning" />
 {entry.currentStreak}
 </span>
 )}
 </div>
 </div>
 <div className="text-right">
 <p className="text-sm font-bold text-foreground">
 {(entry.totalPoints || 0).toLocaleString()}
 </p>
 <p className="text-xs text-muted-foreground">{isAr ? 'نقاط' : 'pts'}</p>
 </div>
 </div>
 ))}
 {entries.length === 0 && (
 <div className="py-12 text-center text-sm text-muted-foreground">
 {isAr ? 'لا توجد بيانات للفترة المحددة' : 'No data for selected period'}
 </div>
 )}
 </div>
 ) : (
 <div className="divide-y">
 {teamEntries.map((entry, idx) => (
 <div
 key={entry.teamId || idx}
 className={`flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/30 ${
 idx < 3 ? 'bg-warning-soft/30' : ''
 }`}
 >
 <div className="w-8 flex justify-center">{rankBadge(entry.rank || idx + 1)}</div>
 <div className="w-9 h-9 rounded-full bg-brand-surface flex items-center justify-center">
 <Users className="w-4 h-4 text-brand" />
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-sm font-medium text-foreground truncate">
 {entry.teamName || entry.teamId}
 </p>
 <p className="text-xs text-muted-foreground">
 {entry.memberCount} {isAr ? 'أعضاء' : 'members'}
 </p>
 </div>
 <div className="text-right">
 <p className="text-sm font-bold text-foreground">
 {(entry.totalPoints || 0).toLocaleString()}
 </p>
 <p className="text-xs text-muted-foreground">
 {isAr ? 'متوسط' : 'avg'}: {Math.round(entry.averagePoints || 0).toLocaleString()}
 </p>
 </div>
 </div>
 ))}
 {teamEntries.length === 0 && (
 <div className="py-12 text-center text-sm text-muted-foreground">
 {isAr ? 'لا توجد بيانات للفرق' : 'No team data available'}
 </div>
 )}
 </div>
 )}
 </div>
 </div>
 </DashboardLayout>
 );
}
