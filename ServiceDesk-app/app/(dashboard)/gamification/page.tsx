'use client';

import { useState } from 'react';
import {
 Trophy,
 Flame,
 Star,
 TrendingUp,
 Award,
 Crown,
 Sprout,
 Flower,
 Flower2,
 TreePine,
 Target,
 ChevronRight,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useLocale } from '@/hooks/useLocale';
import {
 useMyGamificationProfile,
 useLeaderboard,
 useMyAchievements,
 useMyRank,
} from '@/hooks/useGamification';
import Link from 'next/link';

// ── Growth state visual config ───────────────────────────────

const growthStateConfig: Record<string, { icon: typeof Sprout; color: string; bg: string; label: string; labelAr: string }> = {
 seed: { icon: Target, color: 'text-muted-foreground', bg: 'bg-muted', label: 'Seed', labelAr: 'بذرة' },
 sprout: { icon: Sprout, color: 'text-success', bg: 'bg-success-soft', label: 'Sprout', labelAr: 'برعم' },
 bud: { icon: Flower, color: 'text-warning', bg: 'bg-warning-soft', label: 'Bud', labelAr: 'كُم' },
 bloom: { icon: Flower2, color: 'text-destructive', bg: 'bg-destructive-soft', label: 'Bloom', labelAr: 'زهرة' },
 full_bloom: { icon: TreePine, color: 'text-success', bg: 'bg-success-soft', label: 'Full Bloom', labelAr: 'إزهار كامل' },
};

export default function GamificationPage() {
 const { locale } = useLocale();
 const isAr = locale === 'ar';
 const [leaderboardPeriod] = useState('weekly');

 const { data: profileData, isLoading: profileLoading } = useMyGamificationProfile();
 const { data: rankData } = useMyRank(leaderboardPeriod);
 const { data: leaderboardData } = useLeaderboard({ period: leaderboardPeriod, limit: '5' });
 const { data: achievementsData } = useMyAchievements();

 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 const profile = (profileData as any)?.data?.profile;
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 const rank = (rankData as any)?.data;
 const leaderboard = (leaderboardData as any)?.data || [];
 const achievements = (achievementsData as any)?.data || [];

 const gs = growthStateConfig[profile?.growthState || 'seed'];
 const GrowthIcon = gs.icon;

 return (
 <DashboardLayout>
 <div className="space-y-6">
 {/* Header */}
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl font-bold text-foreground">
 {isAr ? 'التلعيب' : 'Gamification'}
 </h1>
 <p className="text-sm text-muted-foreground mt-1">
 {isAr ? 'تابع تقدمك وإنجازاتك' : 'Track your progress and achievements'}
 </p>
 </div>
 </div>

 {/* Stats Cards Row */}
 {profileLoading ? (
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
 {[...Array(4)].map((_, i) => (
 <div key={i} className="h-28 bg-card rounded-xl border animate-pulse" />
 ))}
 </div>
 ) : (
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
 {/* Total Points */}
 <div className="bg-card rounded-xl border p-5">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-lg bg-warning-soft flex items-center justify-center">
 <Star className="w-5 h-5 text-warning" />
 </div>
 <div>
 <p className="text-xs text-muted-foreground font-medium">
 {isAr ? 'إجمالي النقاط' : 'Total Points'}
 </p>
 <p className="text-2xl font-bold text-foreground">
 {(profile?.totalPoints || 0).toLocaleString()}
 </p>
 </div>
 </div>
 </div>

 {/* Level & Growth State */}
 <div className="bg-card rounded-xl border p-5">
 <div className="flex items-center gap-3">
 <div className={`w-10 h-10 rounded-lg ${gs.bg} flex items-center justify-center`}>
 <GrowthIcon className={`w-5 h-5 ${gs.color}`} />
 </div>
 <div>
 <p className="text-xs text-muted-foreground font-medium">
 {isAr ? 'المستوى' : 'Level'}
 </p>
 <p className="text-2xl font-bold text-foreground">
 {profile?.currentLevel || 1}
 </p>
 <p className={`text-xs font-medium ${gs.color}`}>
 {isAr ? gs.labelAr : gs.label}
 </p>
 </div>
 </div>
 </div>

 {/* Streak */}
 <div className="bg-card rounded-xl border p-5">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-lg bg-warning-soft flex items-center justify-center">
 <Flame className="w-5 h-5 text-warning" />
 </div>
 <div>
 <p className="text-xs text-muted-foreground font-medium">
 {isAr ? 'سلسلة الأيام' : 'Current Streak'}
 </p>
 <p className="text-2xl font-bold text-foreground">
 {profile?.currentStreak || 0} {isAr ? 'يوم' : 'days'}
 </p>
 <p className="text-xs text-muted-foreground">
 {isAr ? 'أطول:' : 'Best:'} {profile?.longestStreak || 0}
 </p>
 </div>
 </div>
 </div>

 {/* Rank */}
 <div className="bg-card rounded-xl border p-5">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-lg bg-info-soft flex items-center justify-center">
 <Crown className="w-5 h-5 text-info" />
 </div>
 <div>
 <p className="text-xs text-muted-foreground font-medium">
 {isAr ? 'الترتيب' : 'Your Rank'}
 </p>
 <p className="text-2xl font-bold text-foreground">
 #{rank?.rank || '—'}
 </p>
 <p className="text-xs text-muted-foreground">
 {isAr ? 'من' : 'of'} {rank?.totalParticipants || '—'}
 </p>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* Two-column layout */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 {/* Leaderboard Preview */}
 <div className="bg-card rounded-xl border">
 <div className="flex items-center justify-between p-5 border-b">
 <div className="flex items-center gap-2">
 <Trophy className="w-5 h-5 text-warning" />
 <h2 className="font-semibold text-foreground">
 {isAr ? 'المتصدرين' : 'Leaderboard'}
 </h2>
 </div>
 <Link
 href="/gamification/leaderboard"
 className="text-xs text-brand hover:underline flex items-center gap-1"
 >
 {isAr ? 'عرض الكل' : 'View all'}
 <ChevronRight className="w-3 h-3" />
 </Link>
 </div>
 <div className="divide-y">
 {(Array.isArray(leaderboard) ? leaderboard : []).slice(0, 5).map((entry: any, idx: number) => (
 <div key={entry.userId || idx} className="flex items-center gap-3 px-5 py-3">
 <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
 idx === 0 ? 'bg-warning-soft text-warning' :
 idx === 1 ? 'bg-muted text-muted-foreground' :
 idx === 2 ? 'bg-warning-soft text-warning' :
 'bg-muted text-muted-foreground'
 }`}>
 {entry.rank || idx + 1}
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-sm font-medium text-foreground truncate">
 {entry.userName || entry.userId}
 </p>
 <p className="text-xs text-muted-foreground">
 {isAr ? 'المستوى' : 'Lv.'} {entry.currentLevel}
 </p>
 </div>
 <div className="text-right">
 <p className="text-sm font-semibold text-foreground">
 {(entry.totalPoints || 0).toLocaleString()}
 </p>
 <p className="text-xs text-muted-foreground">
 {isAr ? 'نقاط' : 'pts'}
 </p>
 </div>
 </div>
 ))}
 {(!leaderboard || leaderboard.length === 0) && (
 <div className="px-5 py-8 text-center text-sm text-muted-foreground">
 {isAr ? 'لا توجد بيانات بعد' : 'No data yet'}
 </div>
 )}
 </div>
 </div>

 {/* Achievements Preview */}
 <div className="bg-card rounded-xl border">
 <div className="flex items-center justify-between p-5 border-b">
 <div className="flex items-center gap-2">
 <Award className="w-5 h-5 text-info" />
 <h2 className="font-semibold text-foreground">
 {isAr ? 'الإنجازات' : 'Achievements'}
 </h2>
 </div>
 <Link
 href="/gamification/achievements"
 className="text-xs text-brand hover:underline flex items-center gap-1"
 >
 {isAr ? 'عرض الكل' : 'View all'}
 <ChevronRight className="w-3 h-3" />
 </Link>
 </div>
 <div className="p-5">
 <div className="flex items-center gap-2 mb-4">
 <TrendingUp className="w-4 h-4 text-muted-foreground" />
 <p className="text-sm text-muted-foreground">
 {profile?.achievementCount || 0} {isAr ? 'إنجاز مفتوح' : 'unlocked'}
 </p>
 </div>
 <div className="grid grid-cols-2 gap-3">
 {(Array.isArray(achievements) ? achievements : []).slice(0, 4).map((a: any) => (
 <div
 key={a.achievementCode || a._id}
 className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg"
 >
 <span className="text-xl">{a.icon || '🏆'}</span>
 <div className="min-w-0">
 <p className="text-xs font-medium text-foreground truncate">
 {a.name || a.achievementCode}
 </p>
 <p className="text-[10px] text-muted-foreground">
 {a.unlockedAt ? new Date(a.unlockedAt).toLocaleDateString() : ''}
 </p>
 </div>
 </div>
 ))}
 </div>
 {(!achievements || achievements.length === 0) && (
 <div className="text-center text-sm text-muted-foreground py-4">
 {isAr ? 'لم تفتح أي إنجاز بعد' : 'No achievements yet'}
 </div>
 )}
 </div>
 </div>
 </div>

 {/* Recent Points Activity */}
 {(profileData as any)?.data?.recentPoints?.length > 0 && (
 <div className="bg-card rounded-xl border">
 <div className="flex items-center gap-2 p-5 border-b">
 <Star className="w-5 h-5 text-warning" />
 <h2 className="font-semibold text-foreground">
 {isAr ? 'آخر النقاط' : 'Recent Points'}
 </h2>
 </div>
 <div className="divide-y">
 {((profileData as any)?.data?.recentPoints || []).slice(0, 8).map((entry: any) => (
 <div key={entry._id} className="flex items-center justify-between px-5 py-3">
 <div>
 <p className="text-sm font-medium text-foreground">
 {entry.reasonCode?.replace(/_/g, ' ')}
 </p>
 <p className="text-xs text-muted-foreground">
 {new Date(entry.createdAt).toLocaleDateString()} &middot; {entry.sourceModule}
 </p>
 </div>
 <span className={`text-sm font-semibold ${entry.pointsDelta >= 0 ? 'text-success' : 'text-destructive'}`}>
 {entry.pointsDelta >= 0 ? '+' : ''}{entry.pointsDelta}
 </span>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 </DashboardLayout>
 );
}
