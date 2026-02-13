'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

// Start Node - Green circle
export const StartNode = memo(({ data, selected }: NodeProps) => {
  return (
    <div
      className={`flex items-center justify-center w-16 h-16 rounded-full bg-green-100 border-2 ${
        selected ? 'border-green-600 shadow-lg' : 'border-green-400'
      } transition-all`}
    >
      <span className="text-xs font-semibold text-green-700">
        {(data as Record<string, unknown>).label as string || 'Start'}
      </span>
      <Handle type="source" position={Position.Bottom} className="!bg-green-500 !w-3 !h-3" />
    </div>
  );
});
StartNode.displayName = 'StartNode';

// End Node - Red circle
export const EndNode = memo(({ data, selected }: NodeProps) => {
  return (
    <div
      className={`flex items-center justify-center w-16 h-16 rounded-full bg-red-100 border-2 ${
        selected ? 'border-red-600 shadow-lg' : 'border-red-400'
      } transition-all`}
    >
      <span className="text-xs font-semibold text-red-700">
        {(data as Record<string, unknown>).label as string || 'End'}
      </span>
      <Handle type="target" position={Position.Top} className="!bg-red-500 !w-3 !h-3" />
    </div>
  );
});
EndNode.displayName = 'EndNode';

// Process Node - Blue rectangle
export const ProcessNode = memo(({ data, selected }: NodeProps) => {
  return (
    <div
      className={`px-6 py-4 min-w-[140px] rounded-lg bg-blue-50 border-2 ${
        selected ? 'border-blue-600 shadow-lg' : 'border-blue-300'
      } transition-all`}
    >
      <Handle type="target" position={Position.Top} className="!bg-blue-500 !w-3 !h-3" />
      <div className="text-center">
        <span className="text-sm font-medium text-blue-800">
          {(data as Record<string, unknown>).label as string || 'Process'}
        </span>
        {typeof (data as Record<string, unknown>).description === 'string' && (
          <p className="text-xs text-blue-500 mt-1">
            {String((data as Record<string, unknown>).description)}
          </p>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-blue-500 !w-3 !h-3" />
    </div>
  );
});
ProcessNode.displayName = 'ProcessNode';

// Decision Node - Yellow diamond
export const DecisionNode = memo(({ data, selected }: NodeProps) => {
  return (
    <div className="relative">
      <Handle type="target" position={Position.Top} className="!bg-yellow-600 !w-3 !h-3" style={{ top: -6 }} />
      <div
        className={`w-24 h-24 flex items-center justify-center border-2 ${
          selected ? 'border-yellow-600 shadow-lg' : 'border-yellow-400'
        } bg-yellow-50 transition-all`}
        style={{ transform: 'rotate(45deg)' }}
      >
        <span
          className="text-xs font-semibold text-yellow-800 text-center leading-tight max-w-[60px]"
          style={{ transform: 'rotate(-45deg)' }}
        >
          {(data as Record<string, unknown>).label as string || 'Decision'}
        </span>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-yellow-600 !w-3 !h-3" style={{ bottom: -6 }} />
      <Handle type="source" position={Position.Right} id="right" className="!bg-yellow-600 !w-3 !h-3" style={{ right: -6 }} />
      <Handle type="source" position={Position.Left} id="left" className="!bg-yellow-600 !w-3 !h-3" style={{ left: -6 }} />
    </div>
  );
});
DecisionNode.displayName = 'DecisionNode';

// Input/Output Node - Purple parallelogram-like shape
export const InputOutputNode = memo(({ data, selected }: NodeProps) => {
  return (
    <div
      className={`px-6 py-4 min-w-[140px] rounded-lg bg-purple-50 border-2 ${
        selected ? 'border-purple-600 shadow-lg' : 'border-purple-300'
      } transition-all skew-x-[-6deg]`}
    >
      <Handle type="target" position={Position.Top} className="!bg-purple-500 !w-3 !h-3" />
      <div className="text-center skew-x-[6deg]">
        <span className="text-sm font-medium text-purple-800">
          {(data as Record<string, unknown>).label as string || 'I/O'}
        </span>
        {typeof (data as Record<string, unknown>).description === 'string' && (
          <p className="text-xs text-purple-500 mt-1">
            {String((data as Record<string, unknown>).description)}
          </p>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-purple-500 !w-3 !h-3" />
    </div>
  );
});
InputOutputNode.displayName = 'InputOutputNode';

// Delay Node - Orange rectangle with rounded sides
export const DelayNode = memo(({ data, selected }: NodeProps) => {
  return (
    <div
      className={`px-6 py-4 min-w-[140px] rounded-full bg-orange-50 border-2 ${
        selected ? 'border-orange-600 shadow-lg' : 'border-orange-300'
      } transition-all`}
    >
      <Handle type="target" position={Position.Top} className="!bg-orange-500 !w-3 !h-3" />
      <div className="text-center">
        <span className="text-sm font-medium text-orange-800">
          {(data as Record<string, unknown>).label as string || 'Delay'}
        </span>
        {typeof (data as Record<string, unknown>).description === 'string' && (
          <p className="text-xs text-orange-500 mt-1">
            {String((data as Record<string, unknown>).description)}
          </p>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-orange-500 !w-3 !h-3" />
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
