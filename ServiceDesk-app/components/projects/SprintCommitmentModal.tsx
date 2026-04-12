'use client';

import { useState } from 'react';
import { X, AlertTriangle, CheckCircle, Target, Users, Zap } from 'lucide-react';

interface SprintCommitmentModalProps {
 isOpen: boolean;
 onClose: () => void;
 onConfirm: () => void;
 sprintName: string;
 sprintGoal: string;
 itemCount: number;
 totalPoints: number;
 capacity: number;
 validationErrors: string[];
 validationWarnings: string[];
}

export default function SprintCommitmentModal({
 isOpen,
 onClose,
 onConfirm,
 sprintName,
 sprintGoal,
 itemCount,
 totalPoints,
 capacity,
 validationErrors,
 validationWarnings,
}: SprintCommitmentModalProps) {
 const [confirmed, setConfirmed] = useState(false);

 if (!isOpen) return null;

 const hasErrors = validationErrors.length > 0;
 const capacityPercentage = capacity > 0 ? Math.round((totalPoints / capacity) * 100) : 0;

 const getCapacityStatus = () => {
 if (capacityPercentage > 100) return { color: 'red', label: 'Over Capacity', icon: AlertTriangle };
 if (capacityPercentage >= 80) return { color: 'yellow', label: 'Near Capacity', icon: AlertTriangle };
 return { color: 'green', label: 'Within Capacity', icon: CheckCircle };
 };

 const status = getCapacityStatus();

 return (
 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
 <div className="bg-background rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
 {/* Header */}
 <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-gradient-to-r from-info to-info">
 <div>
 <h2 className="text-xl font-semibold text-white">Confirm Sprint Commitment</h2>
 <p className="text-sm text-info/40 mt-1">{sprintName}</p>
 </div>
 <button
 onClick={onClose}
 className="p-2 text-white hover:bg-background/20 rounded-lg transition-colors"
 >
 <X className="h-5 w-5" />
 </button>
 </div>

 {/* Content */}
 <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
 {/* Sprint Goal */}
 <div className="mb-6">
 <div className="flex items-center gap-2 mb-2">
 <Target className="h-5 w-5 text-info" />
 <h3 className="text-sm font-semibold text-foreground">Sprint Goal</h3>
 </div>
 <div className="bg-info-soft rounded-lg p-4 border border-info/20">
 <p className="text-foreground">{sprintGoal || <span className="text-muted-foreground italic">No goal set</span>}</p>
 </div>
 </div>

 {/* Summary */}
 <div className="mb-6">
 <h3 className="text-sm font-semibold text-foreground mb-3">Sprint Summary</h3>
 <div className="grid grid-cols-3 gap-4">
 <div className="bg-muted/50 rounded-lg p-4 border border-border">
 <div className="flex items-center gap-2 mb-2">
 <Users className="h-4 w-4 text-muted-foreground" />
 <span className="text-xs text-muted-foreground">Items</span>
 </div>
 <div className="text-2xl font-bold text-foreground">{itemCount}</div>
 </div>
 <div className="bg-muted/50 rounded-lg p-4 border border-border">
 <div className="flex items-center gap-2 mb-2">
 <Zap className="h-4 w-4 text-muted-foreground" />
 <span className="text-xs text-muted-foreground">Story Points</span>
 </div>
 <div className="text-2xl font-bold text-foreground">{totalPoints}</div>
 </div>
 <div className="bg-muted/50 rounded-lg p-4 border border-border">
 <div className="flex items-center gap-2 mb-2">
 <Target className="h-4 w-4 text-muted-foreground" />
 <span className="text-xs text-muted-foreground">Capacity</span>
 </div>
 <div className="text-2xl font-bold text-foreground">{capacity}</div>
 </div>
 </div>
 </div>

 {/* Capacity Status */}
 <div className="mb-6">
 <h3 className="text-sm font-semibold text-foreground mb-3">Capacity Status</h3>
 <div className={`bg-${status.color}-50 rounded-lg p-4 border border-${status.color}-200`}>
 <div className="flex items-center gap-3 mb-3">
 <status.icon className={`h-5 w-5 text-${status.color}-600`} />
 <span className={`text-sm font-semibold text-${status.color}-900`}>{status.label}</span>
 </div>
 <div className="w-full bg-muted rounded-full h-3 mb-2">
 <div
 className={`h-3 rounded-full transition-all bg-${status.color}-500`}
 style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
 />
 </div>
 <div className="flex items-center justify-between text-sm">
 <span className={`text-${status.color}-700`}>
 {totalPoints} / {capacity} points
 </span>
 <span className={`font-semibold text-${status.color}-900`}>
 {capacityPercentage}%
 </span>
 </div>
 </div>
 </div>

 {/* Validation Errors */}
 {hasErrors && (
 <div className="mb-6">
 <h3 className="text-sm font-semibold text-destructive mb-3 flex items-center gap-2">
 <AlertTriangle className="h-4 w-4" />
 Blocking Issues
 </h3>
 <div className="space-y-2">
 {validationErrors.map((error, index) => (
 <div key={index} className="bg-destructive-soft rounded-lg p-3 border border-destructive/30">
 <p className="text-sm text-destructive">• {error}</p>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Validation Warnings */}
 {validationWarnings.length > 0 && (
 <div className="mb-6">
 <h3 className="text-sm font-semibold text-warning mb-3 flex items-center gap-2">
 <AlertTriangle className="h-4 w-4" />
 Warnings
 </h3>
 <div className="space-y-2">
 {validationWarnings.map((warning, index) => (
 <div key={index} className="bg-warning-soft rounded-lg p-3 border border-warning/30">
 <p className="text-sm text-warning">• {warning}</p>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Confirmation Checkbox */}
 {!hasErrors && (
 <div className="bg-muted/50 rounded-lg p-4 border border-border">
 <label className="flex items-start gap-3 cursor-pointer">
 <input
 type="checkbox"
 checked={confirmed}
 onChange={(e) => setConfirmed(e.target.checked)}
 className="mt-1 w-4 h-4 text-info border-border rounded focus:ring-info"
 />
 <div className="flex-1">
 <p className="text-sm font-medium text-foreground">
 I confirm that the team commits to this sprint scope
 </p>
 <p className="text-xs text-muted-foreground mt-1">
 The sprint will start immediately and items will be locked for planning.
 </p>
 </div>
 </label>
 </div>
 )}
 </div>

 {/* Footer */}
 <div className="px-6 py-4 border-t border-border bg-muted/50 flex items-center justify-between">
 <button
 onClick={onClose}
 className="px-4 py-2 text-foreground hover:bg-muted rounded-lg transition-colors"
 >
 Cancel
 </button>
 <button
 onClick={onConfirm}
 disabled={hasErrors || !confirmed}
 className="px-6 py-2 bg-info text-white rounded-lg hover:bg-info transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
 >
 <CheckCircle className="h-4 w-4" />
 Start Sprint
 </button>
 </div>
 </div>
 </div>
 );
}
