'use client';

import { LucideIcon, FolderKanban, Plus } from 'lucide-react';
import Link from 'next/link';

interface EmptyStateProps {
 icon?: LucideIcon;
 title: string;
 description?: string;
 actionLabel?: string;
 actionHref?: string;
 onAction?: () => void;
 variant?: 'default' | 'minimal';
}

export default function EmptyState({
 icon: Icon = FolderKanban,
 title,
 description,
 actionLabel,
 actionHref,
 onAction,
 variant = 'default',
}: EmptyStateProps) {
 const ActionButton = () => {
 const buttonClasses = variant === 'default'
 ? 'inline-flex items-center gap-2 bg-brand hover:bg-brand-strong text-brand-foreground px-6 py-3 rounded-lg transition-colors font-medium'
 : 'inline-flex items-center gap-2 text-brand hover:text-brand-strong text-sm transition-colors';

 const content = (
 <>
 <Plus className="h-5 w-5" />
 {actionLabel}
 </>
 );

 if (actionHref) {
 return (
 <Link href={actionHref} className={buttonClasses}>
 {content}
 </Link>
 );
 }

 if (onAction) {
 return (
 <button onClick={onAction} className={buttonClasses}>
 {content}
 </button>
 );
 }

 return null;
 };

 if (variant === 'minimal') {
 return (
 <div className="text-center py-8 px-4">
 <Icon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
 <p className="text-muted-foreground text-sm mb-3">{title}</p>
 {description && (
 <p className="text-muted-foreground text-xs mb-4">{description}</p>
 )}
 <ActionButton />
 </div>
 );
 }

 return (
 <div className="bg-background dark:bg-muted border border-border dark:border-border/30 rounded-xl p-8 md:p-12 text-center shadow-sm">
 <Icon className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground dark:text-muted-foreground mx-auto mb-4" />
 <h2 className="text-lg md:text-xl font-semibold text-foreground dark:text-white mb-2">
 {title}
 </h2>
 {description && (
 <p className="text-muted-foreground dark:text-muted-foreground mb-6 max-w-md mx-auto">
 {description}
 </p>
 )}
 <ActionButton />
 </div>
 );
}
