'use client';

import { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';


interface Task {
 _id: string;
 key: string;
 title: string;
 status: {
 id: string;
 name: string;
 };
}

interface CompleteSprintModalProps {
 isOpen: boolean;
 onClose: () => void;
 onComplete: (moveToBacklog: boolean) => Promise<void>;
 incompleteTasks: Task[];
 sprintName: string;
}

export function CompleteSprintModal({
 isOpen,
 onClose,
 onComplete,
 incompleteTasks,
 sprintName,
}: CompleteSprintModalProps) {
 const [moveToBacklog, setMoveToBacklog] = useState(true);
 const [isSubmitting, setIsSubmitting] = useState(false);

 if (!isOpen) return null;

 const handleComplete = async () => {
 setIsSubmitting(true);
 try {
 await onComplete(moveToBacklog);
 onClose();
 } catch (error) {
 console.error('Failed to complete sprint:', error);
 } finally {
 setIsSubmitting(false);
 }
 };

 return (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
 <div className="bg-background rounded-lg w-full max-w-2xl shadow-xl">
 <div className="flex items-center justify-between px-6 py-4 border-b border-border">
 <h2 className="text-xl font-semibold text-foreground">
 Complete Sprint
 </h2>
 <button onClick={onClose} className="text-muted-foreground hover:text-muted-foreground">
 <X className="h-5 w-5" />
 </button>
 </div>

 <div className="px-6 py-4">
 <div className="mb-4">
 <p className="text-foreground mb-2">
 {`Are you sure you want to complete "${sprintName}"?`}
 </p>
 </div>

 {incompleteTasks.length > 0 && (
 <div className="bg-warning-soft border border-warning/20 rounded-lg p-4 mb-4">
 <div className="flex items-start gap-2">
 <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
 <div className="flex-1">
 <h3 className="font-medium text-warning mb-1">
 Incomplete Tasks
 </h3>
 <p className="text-sm text-warning mb-3">
 {`There are ${incompleteTasks.length} incomplete task${incompleteTasks.length !== 1 ? 's' : ''} in this sprint.`}
 </p>

 <div className="max-h-48 overflow-y-auto space-y-2">
 {incompleteTasks.slice(0, 10).map((task) => (
 <div key={task._id} className="flex items-center gap-2 text-sm">
 <span className="text-brand bg-brand-soft px-1.5 py-0.5 rounded text-xs">
 {task.key}
 </span>
 <span className="text-foreground">{task.title}</span>
 </div>
 ))}
 {incompleteTasks.length > 10 && (
 <p className="text-sm text-muted-foreground">
 +{incompleteTasks.length - 10} more tasks
 </p>
 )}
 </div>
 </div>
 </div>
 </div>
 )}

 <div className="space-y-3">
 <label className="flex items-start gap-3 cursor-pointer">
 <input
 type="radio"
 checked={moveToBacklog}
 onChange={() => setMoveToBacklog(true)}
 className="mt-1"
 />
 <div>
 <div className="font-medium text-foreground">
 Move to Backlog
 </div>
 <div className="text-sm text-muted-foreground">
 Incomplete tasks will be moved back to the backlog
 </div>
 </div>
 </label>

 <label className="flex items-start gap-3 cursor-pointer">
 <input
 type="radio"
 checked={!moveToBacklog}
 onChange={() => setMoveToBacklog(false)}
 className="mt-1"
 />
 <div>
 <div className="font-medium text-foreground">
 Keep in Sprint
 </div>
 <div className="text-sm text-muted-foreground">
 Tasks will remain in the completed sprint for reference
 </div>
 </div>
 </label>
 </div>
 </div>

 <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/50">
 <button
 onClick={onClose}
 disabled={isSubmitting}
 className="px-4 py-2 text-foreground hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
 >
 Cancel
 </button>
 <button
 onClick={handleComplete}
 disabled={isSubmitting}
 className="px-4 py-2 bg-brand hover:bg-brand-strong disabled:bg-brand-soft text-brand-foreground rounded-lg transition-colors"
 >
 {isSubmitting ? 'Completing...' : 'Complete Sprint'}
 </button>
 </div>
 </div>
 </div>
 );
}
