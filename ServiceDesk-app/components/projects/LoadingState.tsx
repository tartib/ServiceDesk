'use client';

interface LoadingStateProps {
 message?: string;
 size?: 'sm' | 'md' | 'lg';
 fullScreen?: boolean;
}

export default function LoadingState({ 
 message, 
 size = 'md',
 fullScreen = true 
}: LoadingStateProps) {
 const sizeClasses = {
 sm: 'h-6 w-6 border-2',
 md: 'h-12 w-12 border-2',
 lg: 'h-16 w-16 border-3',
 };

 const containerClasses = fullScreen 
 ? 'flex items-center justify-center h-full min-h-[200px] bg-muted' 
 : 'flex items-center justify-center py-8';

 return (
 <div data-testid="loading-state" className={containerClasses}>
 <div className="flex flex-col items-center gap-3">
 <div 
 className={`animate-spin rounded-full border-t-brand border-b-brand border-l-transparent border-r-transparent ${sizeClasses[size]}`}
 />
 {message && (
 <p className="text-muted-foreground text-sm">{message}</p>
 )}
 </div>
 </div>
 );
}
