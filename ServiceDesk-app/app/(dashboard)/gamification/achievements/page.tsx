'use client';

import { useState } from 'react';
import {
 Award,
 Lock,
 ArrowLeft,
 Filter,
 CheckCircle2,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useLocale } from '@/hooks/useLocale';
import { useMyAchievements, useAchievementDefinitions } from '@/hooks/useGamification';
import Link from 'next/link';

const categories = [
 { value: 'all', label: 'All', labelAr: 'الكل' },
 { value: 'streak', label: 'Streak', labelAr: 'السلاسل' },
 { value: 'productivity', label: 'Productivity', labelAr: 'الإنتاجية' },
 { value: 'teamwork', label: 'Teamwork', labelAr: 'العمل الجماعي' },
 { value: 'milestone', label: 'Milestone', labelAr: 'إنجازات رئيسية' },
];

export default function AchievementsPage() {
 const { locale } = useLocale();
 const isAr = locale === 'ar';
 const [category, setCategory] = useState('all');

 const { data: myData } = useMyAchievements();
 const { data: defsData, isLoading } = useAchievementDefinitions();

 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 const myAchievements = ((myData as any)?.data || []) as any[];
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 const definitions = ((defsData as any)?.data || []) as any[];

 const unlockedCodes = new Set(myAchievements.map((a) => a.achievementCode));

 const filtered = category === 'all'
 ? definitions
 : definitions.filter((d) => d.category === category);

 const unlockedCount = definitions.filter((d) => unlockedCodes.has(d.code)).length;

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
 <Award className="w-6 h-6 text-info" />
 {isAr ? 'الإنجازات' : 'Achievements'}
 </h1>
 <p className="text-sm text-muted-foreground mt-0.5">
 {unlockedCount}/{definitions.length} {isAr ? 'مفتوح' : 'unlocked'}
 </p>
 </div>
 </div>

 {/* Progress Bar */}
 <div className="bg-card rounded-xl border p-5">
 <div className="flex items-center justify-between text-sm mb-2">
 <span className="font-medium text-foreground">
 {isAr ? 'التقدم الإجمالي' : 'Overall Progress'}
 </span>
 <span className="text-muted-foreground">
 {definitions.length > 0
 ? Math.round((unlockedCount / definitions.length) * 100)
 : 0}%
 </span>
 </div>
 <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
 <div
 className="h-full bg-info rounded-full transition-all duration-500"
 style={{
 width: `${definitions.length > 0 ? (unlockedCount / definitions.length) * 100 : 0}%`,
 }}
 />
 </div>
 </div>

 {/* Category Filter */}
 <div className="flex items-center gap-2">
 <Filter className="w-4 h-4 text-muted-foreground" />
 <div className="flex gap-1 flex-wrap">
 {categories.map((c) => (
 <button
 key={c.value}
 onClick={() => setCategory(c.value)}
 className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
 category === c.value
 ? 'bg-brand text-brand-foreground'
 : 'bg-muted text-muted-foreground hover:text-foreground'
 }`}
 >
 {isAr ? c.labelAr : c.label}
 </button>
 ))}
 </div>
 </div>

 {/* Achievement Grid */}
 {isLoading ? (
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
 {[...Array(6)].map((_, i) => (
 <div key={i} className="h-32 bg-card rounded-xl border animate-pulse" />
 ))}
 </div>
 ) : (
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
 {filtered.map((def) => {
 const unlocked = unlockedCodes.has(def.code);
 const userAch = myAchievements.find((a) => a.achievementCode === def.code);
 return (
 <div
 key={def.code || def._id}
 className={`relative bg-card rounded-xl border p-5 transition-all ${
 unlocked
 ? 'border-info/20 dark:border-info/80 shadow-sm'
 : 'opacity-60'
 }`}
 >
 {unlocked && (
 <div className="absolute top-3 right-3">
 <CheckCircle2 className="w-5 h-5 text-success" />
 </div>
 )}
 <div className="flex items-start gap-3">
 <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
 unlocked ? 'bg-info-soft' : 'bg-muted'
 }`}>
 {def.hidden && !unlocked ? (
 <Lock className="w-5 h-5 text-muted-foreground" />
 ) : (
 def.icon || '🏆'
 )}
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-sm font-semibold text-foreground">
 {def.hidden && !unlocked
 ? (isAr ? 'إنجاز مخفي' : 'Hidden Achievement')
 : (isAr ? def.nameAr || def.name : def.name)}
 </p>
 {!(def.hidden && !unlocked) && (
 <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
 {isAr ? def.descriptionAr || def.description : def.description}
 </p>
 )}
 {unlocked && userAch?.unlockedAt && (
 <p className="text-xs text-success mt-1">
 {isAr ? 'فُتح' : 'Unlocked'} {new Date(userAch.unlockedAt).toLocaleDateString()}
 </p>
 )}
 {!unlocked && userAch?.progress != null && userAch.progress > 0 && (
 <div className="mt-2">
 <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
 <div
 className="h-full bg-info/70 rounded-full"
 style={{ width: `${userAch.progress}%` }}
 />
 </div>
 <p className="text-[10px] text-muted-foreground mt-0.5">
 {userAch.progress}%
 </p>
 </div>
 )}
 </div>
 </div>
 <div className="mt-3">
 <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${
 def.category === 'streak' ? 'bg-warning-soft text-warning' :
 def.category === 'productivity' ? 'bg-brand-soft text-brand' :
 def.category === 'teamwork' ? 'bg-success-soft text-success' :
 'bg-info-soft text-info'
 }`}>
 {isAr
 ? categories.find((c) => c.value === def.category)?.labelAr || def.category
 : def.category}
 </span>
 </div>
 </div>
 );
 })}
 {filtered.length === 0 && (
 <div className="col-span-full py-12 text-center text-sm text-muted-foreground">
 {isAr ? 'لا توجد إنجازات في هذا التصنيف' : 'No achievements in this category'}
 </div>
 )}
 </div>
 )}
 </div>
 </DashboardLayout>
 );
}
