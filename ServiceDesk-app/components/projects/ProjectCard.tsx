'use client';

import React from 'react';
import { Star, MoreHorizontal } from 'lucide-react';

interface ProjectCardProps {
 id: string;
 name: string;
 projectKey: string;
 methodology: {
 code: string;
 };
 lead?: {
 name: string;
 email?: string;
 };
 createdBy?: {
 name: string;
 };
 onClick?: () => void;
 onStar?: () => void;
 onMore?: () => void;
 variant?: 'table' | 'card';
}

const methodologyColors: Record<string, string> = {
 scrum: 'bg-success-soft text-success border-success/30',
 kanban: 'bg-brand-soft text-brand border-brand-border',
 waterfall: 'bg-info-soft text-info border-info/30',
 itil: 'bg-warning-soft text-warning border-warning/30',
 lean: 'bg-warning-soft text-warning border-warning/30',
 okr: 'bg-destructive-soft text-destructive border-destructive/30',
};

function ProjectCard({
 name,
 projectKey,
 methodology,
 lead,
 createdBy,
 onClick,
 onStar,
 onMore,
 variant = 'card',
}: ProjectCardProps) {
 const methodologyColor = methodologyColors[methodology?.code?.toLowerCase()] || 'bg-muted text-foreground border-border';
 const leadName = lead?.name || createdBy?.name;

 // Card variant for mobile/grid view
 if (variant === 'card') {
 return (
 <div
 onClick={onClick}
 className="bg-background dark:bg-muted border border-border dark:border-border/30 rounded-xl p-4 hover:shadow-md hover:border-border dark:hover:border-border/60 transition-all cursor-pointer group"
 >
 <div className="flex items-start justify-between mb-3">
 <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${methodologyColor}`}>
 {projectKey.substring(0, 2)}
 </div>
 <div className="flex items-center gap-1">
 <button
 onClick={(e) => { e.stopPropagation(); onStar?.(); }}
 className="p-1.5 text-muted-foreground hover:text-warning transition-colors"
 aria-label="Star project"
 >
 <Star className="h-4 w-4" />
 </button>
 <button
 onClick={(e) => { e.stopPropagation(); onMore?.(); }}
 className="p-1.5 text-muted-foreground hover:text-muted-foreground transition-colors"
 aria-label="More options"
 >
 <MoreHorizontal className="h-4 w-4" />
 </button>
 </div>
 </div>
 
 <h3 className="font-semibold text-foreground dark:text-white mb-1 group-hover:text-brand dark:group-hover:text-brand transition-colors">
 {name}
 </h3>
 <p className="text-sm text-muted-foreground dark:text-muted-foreground mb-3">{projectKey}</p>
 
 <div className="flex items-center justify-between">
 <span className={`px-2 py-1 text-xs font-medium rounded border ${methodologyColor}`}>
 {methodology.code}
 </span>
 {leadName && (
 <div className="flex items-center gap-2">
 <div className="w-6 h-6 rounded-full bg-brand flex items-center justify-center text-xs text-brand-foreground">
 {leadName[0]}
 </div>
 <span className="text-xs text-muted-foreground dark:text-muted-foreground hidden sm:inline">
 {leadName}
 </span>
 </div>
 )}
 </div>
 </div>
 );
 }

 // Table row variant
 return (
 <tr
 onClick={onClick}
 className="border-b border-border dark:border-border/30 hover:bg-muted/50 dark:hover:bg-muted/50 transition-colors cursor-pointer group"
 >
 <td className="px-4 py-3">
 <button
 onClick={(e) => { e.stopPropagation(); onStar?.(); }}
 className="text-muted-foreground hover:text-warning transition-colors"
 aria-label="Star project"
 >
 <Star className="h-4 w-4" />
 </button>
 </td>
 <td className="px-4 py-3">
 <div className="flex items-center gap-3">
 <div className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold shrink-0 ${methodologyColor}`}>
 {projectKey.substring(0, 2)}
 </div>
 <span className="font-medium text-brand dark:text-brand group-hover:underline truncate">
 {name}
 </span>
 </div>
 </td>
 <td className="px-4 py-3 text-muted-foreground dark:text-muted-foreground hidden sm:table-cell">
 {projectKey}
 </td>
 <td className="px-4 py-3 hidden md:table-cell">
 <span className={`px-2 py-1 text-xs font-medium rounded ${methodologyColor}`}>
 {methodology.code}
 </span>
 </td>
 <td className="px-4 py-3 hidden lg:table-cell">
 {leadName ? (
 <div className="flex items-center gap-2">
 <div className="w-6 h-6 rounded-full bg-brand flex items-center justify-center text-xs text-brand-foreground shrink-0">
 {leadName[0]}
 </div>
 <span className="text-muted-foreground dark:text-muted-foreground text-sm truncate">
 {leadName}
 </span>
 </div>
 ) : (
 <span className="text-muted-foreground">-</span>
 )}
 </td>
 <td className="px-4 py-3">
 <button
 onClick={(e) => { e.stopPropagation(); onMore?.(); }}
 className="text-muted-foreground hover:text-muted-foreground transition-colors"
 aria-label="More options"
 >
 <MoreHorizontal className="h-4 w-4" />
 </button>
 </td>
 </tr>
 );
}

export default React.memo(ProjectCard);
