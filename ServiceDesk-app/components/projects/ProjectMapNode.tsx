'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import {
 Bug,
 Bookmark,
 Layers,
 CheckCircle2,
 Circle,
 Zap,
 ArrowUpCircle,
 ArrowDownCircle,
 MinusCircle,
 AlertTriangle,
 User,
} from 'lucide-react';
import type { MapNodeDataDTO } from '@/lib/domains/pm/dto';

const statusCategoryColors: Record<string, string> = {
 todo: 'bg-muted text-foreground border-border',
 in_progress: 'bg-brand-soft text-brand border-brand-border',
 done: 'bg-success-soft text-success border-success/30',
};

const priorityIcons: Record<string, React.ReactNode> = {
 critical: <AlertTriangle className="h-3 w-3 text-destructive" />,
 high: <ArrowUpCircle className="h-3 w-3 text-warning" />,
 medium: <MinusCircle className="h-3 w-3 text-warning" />,
 low: <ArrowDownCircle className="h-3 w-3 text-brand" />,
};

const typeIcons: Record<string, React.ReactNode> = {
 epic: <Zap className="h-3.5 w-3.5 text-info" />,
 story: <Bookmark className="h-3.5 w-3.5 text-success" />,
 task: <CheckCircle2 className="h-3.5 w-3.5 text-brand" />,
 bug: <Bug className="h-3.5 w-3.5 text-destructive" />,
 subtask: <Layers className="h-3.5 w-3.5 text-muted-foreground" />,
 change_request: <Circle className="h-3.5 w-3.5 text-warning" />,
};

function ProjectMapNodeInner({ data, selected }: NodeProps) {
 const nodeData = data as unknown as MapNodeDataDTO & { labelMap?: Record<string, string> };
 const categoryClass = statusCategoryColors[nodeData.statusCategory] || statusCategoryColors.todo;

 return (
 <div
 className={`
 bg-background rounded-lg border-2 shadow-sm px-3 py-2 min-w-[180px] max-w-[240px]
 transition-all duration-150
 ${selected ? 'border-brand shadow-md ring-2 ring-brand-border' : 'border-border hover:border-border hover:shadow-md'}
 `}
 >
 <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-muted-foreground/30" />

 {/* Header: type icon + key */}
 <div className="flex items-center gap-1.5 mb-1">
 {typeIcons[nodeData.type] || <Circle className="h-3.5 w-3.5 text-muted-foreground" />}
 <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
 {nodeData.key}
 </span>
 <div className="ml-auto flex items-center gap-1">
 {priorityIcons[nodeData.priority]}
 </div>
 </div>

 {/* Title */}
 <p className="text-xs font-medium text-foreground leading-tight line-clamp-2 mb-1.5">
 {nodeData.title}
 </p>

 {/* Footer: status badge + assignee + story points */}
 <div className="flex items-center gap-1.5 flex-wrap">
 <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${categoryClass}`}>
 {nodeData.status}
 </span>

 {nodeData.storyPoints !== undefined && nodeData.storyPoints !== null && (
 <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
 {nodeData.storyPoints}SP
 </span>
 )}

 {nodeData.assigneeName && (
 <div className="ml-auto flex items-center gap-1" title={nodeData.assigneeName}>
 {nodeData.assigneeAvatar ? (
 <img
 src={nodeData.assigneeAvatar}
 alt={nodeData.assigneeName}
 className="h-4 w-4 rounded-full object-cover"
 />
 ) : (
 <User className="h-3 w-3 text-muted-foreground" />
 )}
 <span className="text-[10px] text-muted-foreground max-w-[60px] truncate">
 {nodeData.assigneeName.split(' ')[0]}
 </span>
 </div>
 )}
 </div>

 {/* Labels */}
 {nodeData.labels && nodeData.labels.length > 0 && (
 <div className="flex gap-1 mt-1.5 flex-wrap">
 {nodeData.labels.slice(0, 3).map((label) => (
 <span
 key={label}
 className="text-[9px] bg-info-soft text-info px-1 py-0.5 rounded"
 title={label}
 >
 {nodeData.labelMap?.[label] || label.slice(0, 8)}
 </span>
 ))}
 {nodeData.labels.length > 3 && (
 <span className="text-[9px] text-muted-foreground">+{nodeData.labels.length - 3}</span>
 )}
 </div>
 )}

 <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-muted-foreground/30" />
 </div>
 );
}

const ProjectMapNode = memo(ProjectMapNodeInner);
export default ProjectMapNode;
