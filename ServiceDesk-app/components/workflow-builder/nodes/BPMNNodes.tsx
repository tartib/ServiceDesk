'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import {
 Play,
 StopCircle,
 Clock,
 GitFork,
 GitMerge,
 ShieldCheck,
 Cog,
} from 'lucide-react';

// ============================================
// State Node - حالة عادية (Rounded rectangle)
// ============================================
export const StateNode = memo(({ data, selected }: NodeProps) => {
 const d = data as Record<string, unknown>;
 const color = (d.color as string) || '#ffffff';
 const category = (d.category as string) || 'in_progress';

 const categoryColors: Record<string, { bg: string; border: string; text: string }> = {
 todo: { bg: 'bg-muted', border: 'border-border', text: 'text-muted-foreground' },
 in_progress: { bg: 'bg-brand-surface', border: 'border-brand-border', text: 'text-brand' },
 done: { bg: 'bg-success-soft', border: 'border-success/30', text: 'text-success' },
 cancelled: { bg: 'bg-destructive-soft', border: 'border-destructive/30', text: 'text-destructive' },
 };

 const colors = categoryColors[category] || categoryColors.in_progress;

 return (
 <div
 className={`px-5 py-3 min-w-[150px] max-w-[220px] rounded-xl border-2 ${colors.bg} ${
 selected ? 'ring-2 ring-offset-2 ring-ring shadow-lg' : ''
 } ${colors.border} transition-all hover:shadow-md`}
 >
 <Handle type="target" position={Position.Top} className="!bg-muted-foreground/30 !w-3 !h-3 !border-2 !border-white" />
 <div className="text-center">
 <div
 className="w-3 h-3 rounded-full mx-auto mb-1.5"
 style={{ backgroundColor: color }}
 />
 <p className={`text-sm font-semibold ${colors.text} leading-tight`}>
 {String(d.label || 'State')}
 </p>
 {Boolean(d.nameAr) && (
 <p className="text-xs text-muted-foreground mt-0.5" dir="rtl">
 {String(d.nameAr)}
 </p>
 )}
 {Boolean(d.sla) && (
 <div className="flex items-center justify-center gap-1 mt-1.5">
 <Clock className="w-3 h-3 text-warning" />
 <span className="text-[10px] text-warning font-medium">
 SLA: {String((d.sla as Record<string, unknown>)?.resolutionHours || '?')}h
 </span>
 </div>
 )}
 </div>
 <Handle type="source" position={Position.Bottom} className="!bg-muted-foreground/30 !w-3 !h-3 !border-2 !border-white" />
 </div>
 );
});
StateNode.displayName = 'StateNode';

// ============================================
// Start Node - بداية (Green circle)
// ============================================
export const WFStartNode = memo(({ selected }: NodeProps) => {
 return (
 <div
 className={`flex items-center justify-center w-16 h-16 rounded-full bg-success-soft border-2 ${
 selected ? 'border-success/60 ring-2 ring-offset-2 ring-success/50 shadow-lg' : 'border-success/40'
 } transition-all hover:shadow-md`}
 >
 <Play className="w-5 h-5 text-success ml-0.5" />
 <Handle type="source" position={Position.Bottom} className="!bg-success !w-3 !h-3 !border-2 !border-white" />
 </div>
 );
});
WFStartNode.displayName = 'WFStartNode';

// ============================================
// End Node - نهاية (Red circle with thick border)
// ============================================
export const WFEndNode = memo(({ selected }: NodeProps) => {
 return (
 <div
 className={`flex items-center justify-center w-16 h-16 rounded-full bg-destructive-soft border-[3px] ${
 selected ? 'border-destructive ring-2 ring-offset-2 ring-destructive/50 shadow-lg' : 'border-destructive/60'
 } transition-all hover:shadow-md`}
 >
 <StopCircle className="w-5 h-5 text-destructive" />
 <Handle type="target" position={Position.Top} className="!bg-destructive !w-3 !h-3 !border-2 !border-white" />
 </div>
 );
});
WFEndNode.displayName = 'WFEndNode';

// ============================================
// Fork Node - تفرع (Diamond with + icon)
// ============================================
export const ForkNode = memo(({ selected }: NodeProps) => {
 return (
 <div className="relative">
 <Handle type="target" position={Position.Top} className="!bg-info !w-3 !h-3 !border-2 !border-white" style={{ top: -6 }} />
 <div
 className={`w-20 h-20 flex items-center justify-center border-2 ${
 selected ? 'border-info/60 shadow-lg ring-2 ring-offset-2 ring-info/50' : 'border-info/40'
 } bg-info-soft transition-all hover:shadow-md`}
 style={{ transform: 'rotate(45deg)' }}
 >
 <GitFork
 className="w-5 h-5 text-info"
 style={{ transform: 'rotate(-45deg)' }}
 />
 </div>
 <Handle type="source" position={Position.Bottom} className="!bg-info !w-3 !h-3 !border-2 !border-white" style={{ bottom: -6 }} />
 <Handle type="source" position={Position.Right} id="fork-right" className="!bg-info !w-3 !h-3 !border-2 !border-white" style={{ right: -6 }} />
 <Handle type="source" position={Position.Left} id="fork-left" className="!bg-info !w-3 !h-3 !border-2 !border-white" style={{ left: -6 }} />
 </div>
 );
});
ForkNode.displayName = 'ForkNode';

// ============================================
// Join Node - انضمام (Diamond with merge icon)
// ============================================
export const JoinNode = memo(({ data, selected }: NodeProps) => {
 const d = data as Record<string, unknown>;
 return (
 <div className="relative">
 <Handle type="target" position={Position.Top} className="!bg-success !w-3 !h-3 !border-2 !border-white" style={{ top: -6 }} />
 <Handle type="target" position={Position.Left} id="join-left" className="!bg-success !w-3 !h-3 !border-2 !border-white" style={{ left: -6 }} />
 <Handle type="target" position={Position.Right} id="join-right" className="!bg-success !w-3 !h-3 !border-2 !border-white" style={{ right: -6 }} />
 <div
 className={`w-20 h-20 flex items-center justify-center border-2 ${
 selected ? 'border-success/60 shadow-lg ring-2 ring-offset-2 ring-success/50' : 'border-success/40'
 } bg-success-soft transition-all hover:shadow-md`}
 style={{ transform: 'rotate(45deg)' }}
 >
 <div style={{ transform: 'rotate(-45deg)' }} className="text-center">
 <GitMerge className="w-5 h-5 text-success mx-auto" />
 {Boolean(d.joinStrategy) && (
 <span className="text-[8px] text-success font-bold uppercase block mt-0.5">
 {String(d.joinStrategy)}
 </span>
 )}
 </div>
 </div>
 <Handle type="source" position={Position.Bottom} className="!bg-success !w-3 !h-3 !border-2 !border-white" style={{ bottom: -6 }} />
 </div>
 );
});
JoinNode.displayName = 'JoinNode';

// ============================================
// Timer Node - مؤقت (Circle with clock)
// ============================================
export const TimerNode = memo(({ data, selected }: NodeProps) => {
 const d = data as Record<string, unknown>;
 return (
 <div
 className={`flex flex-col items-center justify-center w-16 h-16 rounded-full bg-warning-soft border-2 border-dashed ${
 selected ? 'border-warning/60 ring-2 ring-offset-2 ring-warning/50 shadow-lg' : 'border-warning/40'
 } transition-all hover:shadow-md`}
 >
 <Handle type="target" position={Position.Top} className="!bg-warning !w-3 !h-3 !border-2 !border-white" />
 <Clock className="w-5 h-5 text-warning" />
 {Boolean(d.hours) && (
 <span className="text-[9px] text-warning font-bold mt-0.5">{String(d.hours)}h</span>
 )}
 <Handle type="source" position={Position.Bottom} className="!bg-warning !w-3 !h-3 !border-2 !border-white" />
 </div>
 );
});
TimerNode.displayName = 'TimerNode';

// ============================================
// Approval Node - موافقة (State with shield icon)
// ============================================
export const ApprovalNode = memo(({ data, selected }: NodeProps) => {
 const d = data as Record<string, unknown>;
 return (
 <div
 className={`px-5 py-3 min-w-[150px] max-w-[220px] rounded-xl border-2 bg-info-soft ${
 selected ? 'border-info/60 ring-2 ring-offset-2 ring-info/50 shadow-lg' : 'border-info/30'
 } transition-all hover:shadow-md`}
 >
 <Handle type="target" position={Position.Top} className="!bg-info/70 !w-3 !h-3 !border-2 !border-white" />
 <div className="text-center">
 <ShieldCheck className="w-5 h-5 text-info mx-auto mb-1" />
 <p className="text-sm font-semibold text-info leading-tight">
 {String(d.label || 'Approval')}
 </p>
 {Boolean(d.nameAr) && (
 <p className="text-xs text-info/80 mt-0.5" dir="rtl">
 {String(d.nameAr)}
 </p>
 )}
 {Boolean(d.approvers) && (
 <p className="text-[10px] text-info/80 mt-1">
 {String((d.approvers as string[])?.length || 0)} approver(s)
 </p>
 )}
 </div>
 <Handle type="source" position={Position.Bottom} className="!bg-info/70 !w-3 !h-3 !border-2 !border-white" />
 </div>
 );
});
ApprovalNode.displayName = 'ApprovalNode';

// ============================================
// Condition Node - شرط (Diamond with ? icon)
// ============================================
export const ConditionNode = memo(({ selected }: NodeProps) => {
 return (
 <div className="relative">
 <Handle type="target" position={Position.Top} className="!bg-warning !w-3 !h-3 !border-2 !border-white" style={{ top: -6 }} />
 <div
 className={`w-20 h-20 flex items-center justify-center border-2 ${
 selected ? 'border-warning shadow-lg ring-2 ring-offset-2 ring-warning/50' : 'border-warning/60'
 } bg-warning-soft transition-all hover:shadow-md`}
 style={{ transform: 'rotate(45deg)' }}
 >
 <span
 className="text-lg font-bold text-warning"
 style={{ transform: 'rotate(-45deg)' }}
 >
 ?
 </span>
 </div>
 <Handle type="source" position={Position.Bottom} className="!bg-warning !w-3 !h-3 !border-2 !border-white" style={{ bottom: -6 }} />
 <Handle type="source" position={Position.Right} id="condition-yes" className="!bg-success !w-3 !h-3 !border-2 !border-white" style={{ right: -6 }} />
 <Handle type="source" position={Position.Left} id="condition-no" className="!bg-destructive !w-3 !h-3 !border-2 !border-white" style={{ left: -6 }} />
 </div>
 );
});
ConditionNode.displayName = 'ConditionNode';

// ============================================
// External Task Node - مهمة خارجية (Rounded rectangle with cog)
// ============================================
export const ExternalTaskNode = memo(({ data, selected }: NodeProps) => {
 const d = data as Record<string, unknown>;
 return (
 <div
 className={`px-5 py-3 min-w-[150px] max-w-[220px] rounded-xl border-2 bg-warning-soft ${
 selected ? 'border-warning/60 ring-2 ring-offset-2 ring-warning/50 shadow-lg' : 'border-warning/30'
 } transition-all hover:shadow-md`}
 >
 <Handle type="target" position={Position.Top} className="!bg-warning/70 !w-3 !h-3 !border-2 !border-white" />
 <div className="text-center">
 <Cog className="w-5 h-5 text-warning mx-auto mb-1" />
 <p className="text-sm font-semibold text-warning leading-tight">
 {String(d.label || 'External Task')}
 </p>
 {Boolean(d.nameAr) && (
 <p className="text-xs text-warning mt-0.5" dir="rtl">
 {String(d.nameAr)}
 </p>
 )}
 {Boolean(d.topic) && (
 <p className="text-[10px] text-warning mt-1 font-mono">
 {String(d.topic)}
 </p>
 )}
 {Boolean(d.retries) && (
 <p className="text-[10px] text-warning">
 retries: {String(d.retries)}
 </p>
 )}
 </div>
 <Handle type="source" position={Position.Bottom} className="!bg-warning/70 !w-3 !h-3 !border-2 !border-white" />
 </div>
 );
});
ExternalTaskNode.displayName = 'ExternalTaskNode';

// ============================================
// Node Types Map
// ============================================
export const wfNodeTypes = {
 wfState: StateNode,
 wfStart: WFStartNode,
 wfEnd: WFEndNode,
 wfFork: ForkNode,
 wfJoin: JoinNode,
 wfTimer: TimerNode,
 wfApproval: ApprovalNode,
 wfCondition: ConditionNode,
 wfExternalTask: ExternalTaskNode,
};
