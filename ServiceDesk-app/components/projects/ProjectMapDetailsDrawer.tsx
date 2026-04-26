'use client';

import { useRouter } from 'next/navigation';
import {
 X,
 ExternalLink,
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
import { useLanguage } from '@/contexts/LanguageContext';
import type { MapNodeDataDTO, MapEdgeDTO } from '@/lib/domains/pm/dto';

interface ProjectMapDetailsDrawerProps {
 nodeId: string | null;
 nodeData: MapNodeDataDTO | null;
 connectedEdges: MapEdgeDTO[];
 projectId: string;
 onClose: () => void;
 labelMap?: Record<string, string>;
}

const priorityConfig: Record<string, { icon: React.ReactNode; label: string; class: string }> = {
 critical: { icon: <AlertTriangle className="h-4 w-4" />, label: 'Critical', class: 'text-destructive' },
 high: { icon: <ArrowUpCircle className="h-4 w-4" />, label: 'High', class: 'text-warning' },
 medium: { icon: <MinusCircle className="h-4 w-4" />, label: 'Medium', class: 'text-warning' },
 low: { icon: <ArrowDownCircle className="h-4 w-4" />, label: 'Low', class: 'text-brand' },
};

const typeConfig: Record<string, { icon: React.ReactNode; label: string }> = {
 epic: { icon: <Zap className="h-4 w-4 text-info" />, label: 'Epic' },
 story: { icon: <Bookmark className="h-4 w-4 text-success" />, label: 'Story' },
 task: { icon: <CheckCircle2 className="h-4 w-4 text-brand" />, label: 'Task' },
 bug: { icon: <Bug className="h-4 w-4 text-destructive" />, label: 'Bug' },
 subtask: { icon: <Layers className="h-4 w-4 text-muted-foreground" />, label: 'Subtask' },
 change_request: { icon: <Circle className="h-4 w-4 text-warning" />, label: 'Change Request' },
};

const statusCategoryColors: Record<string, string> = {
 todo: 'bg-muted text-foreground',
 in_progress: 'bg-brand-soft text-brand',
 done: 'bg-success-soft text-success',
};

export default function ProjectMapDetailsDrawer({
 nodeId,
 nodeData,
 connectedEdges,
 projectId,
 onClose,
 labelMap,
}: ProjectMapDetailsDrawerProps) {
 const router = useRouter();
 const { t } = useLanguage();

 if (!nodeId || !nodeData) return null;

 const pri = priorityConfig[nodeData.priority] || { icon: null, label: nodeData.priority, class: 'text-muted-foreground' };
 const typ = typeConfig[nodeData.type] || { icon: <Circle className="h-4 w-4 text-muted-foreground" />, label: nodeData.type };
 const statusClass = statusCategoryColors[nodeData.statusCategory] || 'bg-muted text-foreground';

 const incomingEdges = connectedEdges.filter((e) => e.target === nodeId);
 const outgoingEdges = connectedEdges.filter((e) => e.source === nodeId);

 return (
 <div className="absolute top-0 right-0 h-full w-80 bg-background border-l border-border shadow-lg z-50 overflow-y-auto">
 {/* Header */}
 <div className="flex items-center justify-between px-4 py-3 border-b border-border">
 <div className="flex items-center gap-2">
 {typ.icon}
 <span className="text-sm font-semibold text-muted-foreground">{nodeData.key}</span>
 </div>
 <div className="flex items-center gap-1">
 <button
 onClick={() => router.push(`/projects/${projectId}/tasks/${nodeId}`)}
 title={t('common.openFull') || 'Open Full Detail'}
 aria-label={t('common.openFull') || 'Open Full Detail'}
 className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
 >
 <ExternalLink className="h-4 w-4" />
 </button>
 <button
 onClick={onClose}
 className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
 >
 <X className="h-4 w-4" />
 </button>
 </div>
 </div>

 {/* Body */}
 <div className="px-4 py-3 space-y-4">
 {/* Title */}
 <h3 className="text-sm font-semibold text-foreground leading-snug">{nodeData.title}</h3>

 {/* Status + Priority row */}
 <div className="flex items-center gap-3">
 <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusClass}`}>
 {nodeData.status}
 </span>
 <div className={`flex items-center gap-1 ${pri.class}`}>
 {pri.icon}
 <span className="text-xs font-medium">{pri.label}</span>
 </div>
 </div>

 {/* Type */}
 <div className="flex items-center gap-2">
 <span className="text-xs text-muted-foreground w-16">{t('projects.board.type') || 'Type'}</span>
 <div className="flex items-center gap-1">
 {typ.icon}
 <span className="text-xs text-foreground">{typ.label}</span>
 </div>
 </div>

 {/* Assignee */}
 {nodeData.assigneeName && (
 <div className="flex items-center gap-2">
 <span className="text-xs text-muted-foreground w-16">{t('projects.board.assignee') || 'Assignee'}</span>
 <div className="flex items-center gap-1.5">
 {nodeData.assigneeAvatar ? (
 // eslint-disable-next-line @next/next/no-img-element
 <img src={nodeData.assigneeAvatar} alt="" className="h-5 w-5 rounded-full object-cover" />
 ) : (
 <User className="h-4 w-4 text-muted-foreground" />
 )}
 <span className="text-xs text-foreground">{nodeData.assigneeName}</span>
 </div>
 </div>
 )}

 {/* Story Points */}
 {nodeData.storyPoints !== undefined && nodeData.storyPoints !== null && (
 <div className="flex items-center gap-2">
 <span className="text-xs text-muted-foreground w-16">{t('projects.board.storyPoints') || 'Points'}</span>
 <span className="text-xs font-medium text-foreground">{nodeData.storyPoints}</span>
 </div>
 )}

 {/* Labels */}
 {nodeData.labels.length > 0 && (
 <div>
 <span className="text-xs text-muted-foreground">{t('projects.board.labels') || 'Labels'}</span>
 <div className="flex gap-1 flex-wrap mt-1">
 {nodeData.labels.map((l) => (
 <span key={l} className="text-[10px] bg-info-soft text-info px-1.5 py-0.5 rounded">
 {labelMap?.[l] || l.slice(0, 8)}
 </span>
 ))}
 </div>
 </div>
 )}

 {/* Connections */}
 {(incomingEdges.length > 0 || outgoingEdges.length > 0) && (
 <div className="border-t border-border pt-3">
 <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
 {t('projects.map.connections') || 'Connections'}
 </p>
 {incomingEdges.length > 0 && (
 <div className="mb-2">
 <p className="text-[10px] text-muted-foreground mb-1">Incoming ({incomingEdges.length})</p>
 {incomingEdges.map((e) => (
 <div key={e.id} className="text-xs text-muted-foreground flex items-center gap-1 mb-0.5">
 <span className="text-muted-foreground">&larr;</span>
 <span className="font-medium">{e.type.replace(/_/g, ' ')}</span>
 </div>
 ))}
 </div>
 )}
 {outgoingEdges.length > 0 && (
 <div>
 <p className="text-[10px] text-muted-foreground mb-1">Outgoing ({outgoingEdges.length})</p>
 {outgoingEdges.map((e) => (
 <div key={e.id} className="text-xs text-muted-foreground flex items-center gap-1 mb-0.5">
 <span className="text-muted-foreground">&rarr;</span>
 <span className="font-medium">{e.type.replace(/_/g, ' ')}</span>
 </div>
 ))}
 </div>
 )}
 </div>
 )}
 </div>
 </div>
 );
}
