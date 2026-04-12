'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Clock, TrendingUp, Wrench, Search, Server } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface IntakeRequest {
 _id: string;
 title: string;
 description: string;
 category: string;
 priority: string;
 stage: string;
 requestedBy?: {
 _id: string;
 profile?: { firstName?: string; lastName?: string; avatar?: string };
 name?: string;
 email?: string;
 };
 createdAt: string;
 scores?: { criterion: string; score: number }[];
}

const priorityColors: Record<string, string> = {
 critical: 'bg-destructive-soft text-destructive',
 high: 'bg-warning-soft text-warning',
 medium: 'bg-warning-soft text-warning',
 low: 'bg-success-soft text-success',
};

const categoryIcons: Record<string, React.ReactNode> = {
 new_product: <TrendingUp className="h-3 w-3" />,
 improvement: <TrendingUp className="h-3 w-3" />,
 maintenance: <Wrench className="h-3 w-3" />,
 research: <Search className="h-3 w-3" />,
 infrastructure: <Server className="h-3 w-3" />,
};

function formatTimeAgo(dateStr: string, t: (key: string) => string): string {
 const diff = Date.now() - new Date(dateStr).getTime();
 const days = Math.floor(diff / (1000 * 60 * 60 * 24));
 if (days > 0) return `${days}${t('intake.card.timeAgo.days')}`;
 const hours = Math.floor(diff / (1000 * 60 * 60));
 if (hours > 0) return `${hours}${t('intake.card.timeAgo.hours')}`;
 const mins = Math.floor(diff / (1000 * 60));
 return `${mins}${t('intake.card.timeAgo.minutes')}`;
}

function IntakeRequestCard({ request }: { request: IntakeRequest }) {
 const router = useRouter();
 const { t } = useLanguage();
 const priorityColor = priorityColors[request.priority] || priorityColors.medium;
 const priorityLabel = t(`intake.priorities.${request.priority}`);
 const categoryIcon = categoryIcons[request.category] || null;
 const categoryLabel = t(`intake.categories.${request.category}`);

 const requesterName = request.requestedBy?.profile
 ? `${request.requestedBy.profile.firstName || ''} ${request.requestedBy.profile.lastName || ''}`.trim()
 : request.requestedBy?.name || request.requestedBy?.email || 'Unknown';

 const requesterInitial = (request.requestedBy?.profile?.firstName?.[0] || requesterName[0] || '?').toUpperCase();

 const avgScore = request.scores && request.scores.length > 0
 ? (request.scores.reduce((sum, s) => sum + s.score, 0) / request.scores.length).toFixed(1)
 : null;

 return (
 <div
 onClick={() => router.push(`/projects/intake/${request._id}`)}
 className="bg-background rounded-lg border border-border p-3 hover:shadow-md hover:border-brand-border transition-all cursor-pointer group"
 >
 <div className="flex items-start justify-between gap-2 mb-2">
 <h4 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-brand transition-colors">
 {request.title}
 </h4>
 <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${priorityColor}`}>
 {priorityLabel}
 </span>
 </div>

 <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{request.description}</p>

 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <div className="flex items-center gap-1 text-xs text-muted-foreground">
 {categoryIcon}
 <span>{categoryLabel}</span>
 </div>
 </div>

 <div className="flex items-center gap-2">
 {avgScore && (
 <span className="text-[10px] bg-brand-surface text-brand px-1.5 py-0.5 rounded font-medium">
 {avgScore}/5
 </span>
 )}
 <div className="flex items-center gap-1 text-xs text-muted-foreground">
 <Clock className="h-3 w-3" />
 <span>{formatTimeAgo(request.createdAt, t)}</span>
 </div>
 </div>
 </div>

 <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border">
 <div className="w-5 h-5 rounded-full bg-info-soft text-info text-[10px] flex items-center justify-center font-medium">
 {requesterInitial}
 </div>
 <span className="text-xs text-muted-foreground truncate">{requesterName}</span>
 </div>
 </div>
 );
}

export default React.memo(IntakeRequestCard);
