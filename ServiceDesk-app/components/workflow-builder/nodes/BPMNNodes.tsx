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
    todo: { bg: 'bg-slate-50', border: 'border-slate-300', text: 'text-slate-700' },
    in_progress: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700' },
    done: { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-700' },
    cancelled: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700' },
  };

  const colors = categoryColors[category] || categoryColors.in_progress;

  return (
    <div
      className={`px-5 py-3 min-w-[150px] max-w-[220px] rounded-xl border-2 ${colors.bg} ${
        selected ? 'ring-2 ring-offset-2 ring-blue-500 shadow-lg' : ''
      } ${colors.border} transition-all hover:shadow-md`}
    >
      <Handle type="target" position={Position.Top} className="!bg-gray-400 !w-3 !h-3 !border-2 !border-white" />
      <div className="text-center">
        <div
          className="w-3 h-3 rounded-full mx-auto mb-1.5"
          style={{ backgroundColor: color }}
        />
        <p className={`text-sm font-semibold ${colors.text} leading-tight`}>
          {String(d.label || 'State')}
        </p>
        {Boolean(d.nameAr) && (
          <p className="text-xs text-gray-400 mt-0.5" dir="rtl">
            {String(d.nameAr)}
          </p>
        )}
        {Boolean(d.sla) && (
          <div className="flex items-center justify-center gap-1 mt-1.5">
            <Clock className="w-3 h-3 text-orange-400" />
            <span className="text-[10px] text-orange-500 font-medium">
              SLA: {String((d.sla as Record<string, unknown>)?.resolutionHours || '?')}h
            </span>
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-gray-400 !w-3 !h-3 !border-2 !border-white" />
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
      className={`flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 border-2 ${
        selected ? 'border-emerald-600 ring-2 ring-offset-2 ring-emerald-400 shadow-lg' : 'border-emerald-400'
      } transition-all hover:shadow-md`}
    >
      <Play className="w-5 h-5 text-emerald-600 ml-0.5" />
      <Handle type="source" position={Position.Bottom} className="!bg-emerald-500 !w-3 !h-3 !border-2 !border-white" />
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
      className={`flex items-center justify-center w-16 h-16 rounded-full bg-red-100 border-[3px] ${
        selected ? 'border-red-600 ring-2 ring-offset-2 ring-red-400 shadow-lg' : 'border-red-400'
      } transition-all hover:shadow-md`}
    >
      <StopCircle className="w-5 h-5 text-red-600" />
      <Handle type="target" position={Position.Top} className="!bg-red-500 !w-3 !h-3 !border-2 !border-white" />
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
      <Handle type="target" position={Position.Top} className="!bg-indigo-500 !w-3 !h-3 !border-2 !border-white" style={{ top: -6 }} />
      <div
        className={`w-20 h-20 flex items-center justify-center border-2 ${
          selected ? 'border-indigo-600 shadow-lg ring-2 ring-offset-2 ring-indigo-400' : 'border-indigo-400'
        } bg-indigo-50 transition-all hover:shadow-md`}
        style={{ transform: 'rotate(45deg)' }}
      >
        <GitFork
          className="w-5 h-5 text-indigo-600"
          style={{ transform: 'rotate(-45deg)' }}
        />
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-indigo-500 !w-3 !h-3 !border-2 !border-white" style={{ bottom: -6 }} />
      <Handle type="source" position={Position.Right} id="fork-right" className="!bg-indigo-500 !w-3 !h-3 !border-2 !border-white" style={{ right: -6 }} />
      <Handle type="source" position={Position.Left} id="fork-left" className="!bg-indigo-500 !w-3 !h-3 !border-2 !border-white" style={{ left: -6 }} />
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
      <Handle type="target" position={Position.Top} className="!bg-teal-500 !w-3 !h-3 !border-2 !border-white" style={{ top: -6 }} />
      <Handle type="target" position={Position.Left} id="join-left" className="!bg-teal-500 !w-3 !h-3 !border-2 !border-white" style={{ left: -6 }} />
      <Handle type="target" position={Position.Right} id="join-right" className="!bg-teal-500 !w-3 !h-3 !border-2 !border-white" style={{ right: -6 }} />
      <div
        className={`w-20 h-20 flex items-center justify-center border-2 ${
          selected ? 'border-teal-600 shadow-lg ring-2 ring-offset-2 ring-teal-400' : 'border-teal-400'
        } bg-teal-50 transition-all hover:shadow-md`}
        style={{ transform: 'rotate(45deg)' }}
      >
        <div style={{ transform: 'rotate(-45deg)' }} className="text-center">
          <GitMerge className="w-5 h-5 text-teal-600 mx-auto" />
          {Boolean(d.joinStrategy) && (
            <span className="text-[8px] text-teal-500 font-bold uppercase block mt-0.5">
              {String(d.joinStrategy)}
            </span>
          )}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-teal-500 !w-3 !h-3 !border-2 !border-white" style={{ bottom: -6 }} />
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
      className={`flex flex-col items-center justify-center w-16 h-16 rounded-full bg-amber-50 border-2 border-dashed ${
        selected ? 'border-amber-600 ring-2 ring-offset-2 ring-amber-400 shadow-lg' : 'border-amber-400'
      } transition-all hover:shadow-md`}
    >
      <Handle type="target" position={Position.Top} className="!bg-amber-500 !w-3 !h-3 !border-2 !border-white" />
      <Clock className="w-5 h-5 text-amber-600" />
      {Boolean(d.hours) && (
        <span className="text-[9px] text-amber-600 font-bold mt-0.5">{String(d.hours)}h</span>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-amber-500 !w-3 !h-3 !border-2 !border-white" />
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
      className={`px-5 py-3 min-w-[150px] max-w-[220px] rounded-xl border-2 bg-violet-50 ${
        selected ? 'border-violet-600 ring-2 ring-offset-2 ring-violet-400 shadow-lg' : 'border-violet-300'
      } transition-all hover:shadow-md`}
    >
      <Handle type="target" position={Position.Top} className="!bg-violet-400 !w-3 !h-3 !border-2 !border-white" />
      <div className="text-center">
        <ShieldCheck className="w-5 h-5 text-violet-500 mx-auto mb-1" />
        <p className="text-sm font-semibold text-violet-700 leading-tight">
          {String(d.label || 'Approval')}
        </p>
        {Boolean(d.nameAr) && (
          <p className="text-xs text-violet-400 mt-0.5" dir="rtl">
            {String(d.nameAr)}
          </p>
        )}
        {Boolean(d.approvers) && (
          <p className="text-[10px] text-violet-400 mt-1">
            {String((d.approvers as string[])?.length || 0)} approver(s)
          </p>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-violet-400 !w-3 !h-3 !border-2 !border-white" />
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
      <Handle type="target" position={Position.Top} className="!bg-yellow-500 !w-3 !h-3 !border-2 !border-white" style={{ top: -6 }} />
      <div
        className={`w-20 h-20 flex items-center justify-center border-2 ${
          selected ? 'border-yellow-600 shadow-lg ring-2 ring-offset-2 ring-yellow-400' : 'border-yellow-400'
        } bg-yellow-50 transition-all hover:shadow-md`}
        style={{ transform: 'rotate(45deg)' }}
      >
        <span
          className="text-lg font-bold text-yellow-600"
          style={{ transform: 'rotate(-45deg)' }}
        >
          ?
        </span>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-yellow-500 !w-3 !h-3 !border-2 !border-white" style={{ bottom: -6 }} />
      <Handle type="source" position={Position.Right} id="condition-yes" className="!bg-green-500 !w-3 !h-3 !border-2 !border-white" style={{ right: -6 }} />
      <Handle type="source" position={Position.Left} id="condition-no" className="!bg-red-500 !w-3 !h-3 !border-2 !border-white" style={{ left: -6 }} />
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
      className={`px-5 py-3 min-w-[150px] max-w-[220px] rounded-xl border-2 bg-orange-50 ${
        selected ? 'border-orange-600 ring-2 ring-offset-2 ring-orange-400 shadow-lg' : 'border-orange-300'
      } transition-all hover:shadow-md`}
    >
      <Handle type="target" position={Position.Top} className="!bg-orange-400 !w-3 !h-3 !border-2 !border-white" />
      <div className="text-center">
        <Cog className="w-5 h-5 text-orange-500 mx-auto mb-1" />
        <p className="text-sm font-semibold text-orange-700 leading-tight">
          {String(d.label || 'External Task')}
        </p>
        {Boolean(d.nameAr) && (
          <p className="text-xs text-orange-400 mt-0.5" dir="rtl">
            {String(d.nameAr)}
          </p>
        )}
        {Boolean(d.topic) && (
          <p className="text-[10px] text-orange-400 mt-1 font-mono">
            {String(d.topic)}
          </p>
        )}
        {Boolean(d.retries) && (
          <p className="text-[10px] text-orange-400">
            retries: {String(d.retries)}
          </p>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-orange-400 !w-3 !h-3 !border-2 !border-white" />
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
