'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

// Start Node - Green circle
export const StartNode = memo(({ data, selected }: NodeProps) => {
 return (
 <div
 className={`flex items-center justify-center w-16 h-16 rounded-full bg-success-soft border-2 ${
 selected ? 'border-success shadow-lg' : 'border-success/60'
 } transition-all`}
 >
 <span className="text-xs font-semibold text-success">
 {(data as Record<string, unknown>).label as string || 'Start'}
 </span>
 <Handle type="source" position={Position.Bottom} className="!bg-success !w-3 !h-3" />
 </div>
 );
});
StartNode.displayName = 'StartNode';

// End Node - Red circle
export const EndNode = memo(({ data, selected }: NodeProps) => {
 return (
 <div
 className={`flex items-center justify-center w-16 h-16 rounded-full bg-destructive-soft border-2 ${
 selected ? 'border-destructive shadow-lg' : 'border-destructive/60'
 } transition-all`}
 >
 <span className="text-xs font-semibold text-destructive">
 {(data as Record<string, unknown>).label as string || 'End'}
 </span>
 <Handle type="target" position={Position.Top} className="!bg-destructive !w-3 !h-3" />
 </div>
 );
});
EndNode.displayName = 'EndNode';

// Process Node - Blue rectangle
export const ProcessNode = memo(({ data, selected }: NodeProps) => {
 return (
 <div
 className={`px-6 py-4 min-w-[140px] rounded-lg bg-brand-surface border-2 ${
 selected ? 'border-brand shadow-lg' : 'border-brand-border'
 } transition-all`}
 >
 <Handle type="target" position={Position.Top} className="!bg-brand !w-3 !h-3" />
 <div className="text-center">
 <span className="text-sm font-medium text-brand">
 {(data as Record<string, unknown>).label as string || 'Process'}
 </span>
 {typeof (data as Record<string, unknown>).description === 'string' && (
 <p className="text-xs text-brand mt-1">
 {String((data as Record<string, unknown>).description)}
 </p>
 )}
 </div>
 <Handle type="source" position={Position.Bottom} className="!bg-brand !w-3 !h-3" />
 </div>
 );
});
ProcessNode.displayName = 'ProcessNode';

// Decision Node - Yellow diamond
export const DecisionNode = memo(({ data, selected }: NodeProps) => {
 return (
 <div className="relative">
 <Handle type="target" position={Position.Top} className="!bg-warning/70 !w-3 !h-3" style={{ top: -6 }} />
 <div
 className={`w-24 h-24 flex items-center justify-center border-2 ${
 selected ? 'border-warning shadow-lg' : 'border-warning/60'
 } bg-warning-soft transition-all`}
 style={{ transform: 'rotate(45deg)' }}
 >
 <span
 className="text-xs font-semibold text-warning text-center leading-tight max-w-[60px]"
 style={{ transform: 'rotate(-45deg)' }}
 >
 {(data as Record<string, unknown>).label as string || 'Decision'}
 </span>
 </div>
 <Handle type="source" position={Position.Bottom} className="!bg-warning/70 !w-3 !h-3" style={{ bottom: -6 }} />
 <Handle type="source" position={Position.Right} id="right" className="!bg-warning/70 !w-3 !h-3" style={{ right: -6 }} />
 <Handle type="source" position={Position.Left} id="left" className="!bg-warning/70 !w-3 !h-3" style={{ left: -6 }} />
 </div>
 );
});
DecisionNode.displayName = 'DecisionNode';

// Input/Output Node - Purple parallelogram-like shape
export const InputOutputNode = memo(({ data, selected }: NodeProps) => {
 return (
 <div
 className={`px-6 py-4 min-w-[140px] rounded-lg bg-info-soft border-2 ${
 selected ? 'border-info/60 shadow-lg' : 'border-info/30'
 } transition-all skew-x-[-6deg]`}
 >
 <Handle type="target" position={Position.Top} className="!bg-info !w-3 !h-3" />
 <div className="text-center skew-x-[6deg]">
 <span className="text-sm font-medium text-info">
 {(data as Record<string, unknown>).label as string || 'I/O'}
 </span>
 {typeof (data as Record<string, unknown>).description === 'string' && (
 <p className="text-xs text-info mt-1">
 {String((data as Record<string, unknown>).description)}
 </p>
 )}
 </div>
 <Handle type="source" position={Position.Bottom} className="!bg-info !w-3 !h-3" />
 </div>
 );
});
InputOutputNode.displayName = 'InputOutputNode';

// Delay Node - Orange rectangle with rounded sides
export const DelayNode = memo(({ data, selected }: NodeProps) => {
 return (
 <div
 className={`px-6 py-4 min-w-[140px] rounded-full bg-warning-soft border-2 ${
 selected ? 'border-warning/60 shadow-lg' : 'border-warning/30'
 } transition-all`}
 >
 <Handle type="target" position={Position.Top} className="!bg-warning !w-3 !h-3" />
 <div className="text-center">
 <span className="text-sm font-medium text-warning">
 {(data as Record<string, unknown>).label as string || 'Delay'}
 </span>
 {typeof (data as Record<string, unknown>).description === 'string' && (
 <p className="text-xs text-warning mt-1">
 {String((data as Record<string, unknown>).description)}
 </p>
 )}
 </div>
 <Handle type="source" position={Position.Bottom} className="!bg-warning !w-3 !h-3" />
 </div>
 );
});
DelayNode.displayName = 'DelayNode';

// Export node types map for React Flow
export const nodeTypes = {
 start: StartNode,
 end: EndNode,
 process: ProcessNode,
 decision: DecisionNode,
 inputOutput: InputOutputNode,
 delay: DelayNode,
};
