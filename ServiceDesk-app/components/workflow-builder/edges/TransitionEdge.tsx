'use client';

import { memo } from 'react';
import {
 BaseEdge,
 EdgeLabelRenderer,
 getSmoothStepPath,
 type EdgeProps,
} from '@xyflow/react';
import { ShieldCheck, CheckSquare, Zap } from 'lucide-react';

// ============================================
// Custom Transition Edge — renders name + rule badges
// ============================================

function TransitionEdge({
 id,
 sourceX,
 sourceY,
 targetX,
 targetY,
 sourcePosition,
 targetPosition,
 label,
 data,
 selected,
 style,
}: EdgeProps) {
 const [edgePath, labelX, labelY] = getSmoothStepPath({
 sourceX,
 sourceY,
 targetX,
 targetY,
 sourcePosition,
 targetPosition,
 borderRadius: 12,
 });

 const d = (data || {}) as Record<string, unknown>;
 const guards = Array.isArray(d.guards) ? d.guards : [];
 const validators = Array.isArray(d.validators) ? d.validators : [];
 const actions = Array.isArray(d.actions) ? d.actions : [];
 const hasRules = guards.length > 0 || validators.length > 0 || actions.length > 0;
 const transitionName = label ? String(label) : '';

 return (
 <>
 <BaseEdge
 id={id}
 path={edgePath}
 style={{
 strokeWidth: selected ? 3 : 2,
 stroke: selected ? '#3B82F6' : '#94A3B8',
 ...style,
 }}
 />
 {(transitionName || hasRules) && (
 <EdgeLabelRenderer>
 <div
 style={{
 position: 'absolute',
 transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
 pointerEvents: 'all',
 }}
 className="nodrag nopan"
 >
 <div
 className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium shadow-sm border transition-all ${
 selected
 ? 'bg-brand-surface border-brand-border text-brand shadow-sm'
 : 'bg-background border-border text-muted-foreground hover:border-border'
 }`}
 >
 {transitionName && (
 <span className="max-w-[120px] truncate">{transitionName}</span>
 )}
 {hasRules && (
 <div className="flex items-center gap-0.5 ms-0.5">
 {guards.length > 0 && (
 <span className="flex items-center" title={`${guards.length} guard(s)`}>
 <ShieldCheck className="w-3 h-3 text-warning" />
 </span>
 )}
 {validators.length > 0 && (
 <span className="flex items-center" title={`${validators.length} validator(s)`}>
 <CheckSquare className="w-3 h-3 text-success" />
 </span>
 )}
 {actions.length > 0 && (
 <span className="flex items-center" title={`${actions.length} action(s)`}>
 <Zap className="w-3 h-3 text-info" />
 </span>
 )}
 </div>
 )}
 </div>
 </div>
 </EdgeLabelRenderer>
 )}
 </>
 );
}

export default memo(TransitionEdge);

export const wfEdgeTypes = {
 transition: TransitionEdge,
};
