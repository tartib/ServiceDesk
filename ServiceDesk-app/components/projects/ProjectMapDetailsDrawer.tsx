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
}

const priorityConfig: Record<string, { icon: React.ReactNode; label: string; class: string }> = {
  critical: { icon: <AlertTriangle className="h-4 w-4" />, label: 'Critical', class: 'text-red-600' },
  high: { icon: <ArrowUpCircle className="h-4 w-4" />, label: 'High', class: 'text-orange-500' },
  medium: { icon: <MinusCircle className="h-4 w-4" />, label: 'Medium', class: 'text-yellow-600' },
  low: { icon: <ArrowDownCircle className="h-4 w-4" />, label: 'Low', class: 'text-blue-400' },
};

const typeConfig: Record<string, { icon: React.ReactNode; label: string }> = {
  epic: { icon: <Zap className="h-4 w-4 text-purple-600" />, label: 'Epic' },
  story: { icon: <Bookmark className="h-4 w-4 text-green-600" />, label: 'Story' },
  task: { icon: <CheckCircle2 className="h-4 w-4 text-blue-600" />, label: 'Task' },
  bug: { icon: <Bug className="h-4 w-4 text-red-600" />, label: 'Bug' },
  subtask: { icon: <Layers className="h-4 w-4 text-gray-500" />, label: 'Subtask' },
  change_request: { icon: <Circle className="h-4 w-4 text-amber-600" />, label: 'Change Request' },
};

const statusCategoryColors: Record<string, string> = {
  todo: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  done: 'bg-green-100 text-green-700',
};

export default function ProjectMapDetailsDrawer({
  nodeId,
  nodeData,
  connectedEdges,
  projectId,
  onClose,
}: ProjectMapDetailsDrawerProps) {
  const router = useRouter();
  const { t } = useLanguage();

  if (!nodeId || !nodeData) return null;

  const pri = priorityConfig[nodeData.priority] || { icon: null, label: nodeData.priority, class: 'text-gray-500' };
  const typ = typeConfig[nodeData.type] || { icon: <Circle className="h-4 w-4 text-gray-400" />, label: nodeData.type };
  const statusClass = statusCategoryColors[nodeData.statusCategory] || 'bg-gray-100 text-gray-700';

  const incomingEdges = connectedEdges.filter((e) => e.target === nodeId);
  const outgoingEdges = connectedEdges.filter((e) => e.source === nodeId);

  return (
    <div className="absolute top-0 right-0 h-full w-80 bg-white border-l border-gray-200 shadow-lg z-50 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          {typ.icon}
          <span className="text-sm font-semibold text-gray-500">{nodeData.key}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => router.push(`/projects/${projectId}/tasks/${nodeId}`)}
            title={t('common.openFull') || 'Open Full Detail'}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-4">
        {/* Title */}
        <h3 className="text-sm font-semibold text-gray-900 leading-snug">{nodeData.title}</h3>

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
          <span className="text-xs text-gray-500 w-16">{t('common.type') || 'Type'}</span>
          <div className="flex items-center gap-1">
            {typ.icon}
            <span className="text-xs text-gray-700">{typ.label}</span>
          </div>
        </div>

        {/* Assignee */}
        {nodeData.assigneeName && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-16">{t('common.assignee') || 'Assignee'}</span>
            <div className="flex items-center gap-1.5">
              {nodeData.assigneeAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={nodeData.assigneeAvatar} alt="" className="h-5 w-5 rounded-full object-cover" />
              ) : (
                <User className="h-4 w-4 text-gray-400" />
              )}
              <span className="text-xs text-gray-700">{nodeData.assigneeName}</span>
            </div>
          </div>
        )}

        {/* Story Points */}
        {nodeData.storyPoints !== undefined && nodeData.storyPoints !== null && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-16">{t('common.points') || 'Points'}</span>
            <span className="text-xs font-medium text-gray-700">{nodeData.storyPoints}</span>
          </div>
        )}

        {/* Labels */}
        {nodeData.labels.length > 0 && (
          <div>
            <span className="text-xs text-gray-500">{t('common.labels') || 'Labels'}</span>
            <div className="flex gap-1 flex-wrap mt-1">
              {nodeData.labels.map((l) => (
                <span key={l} className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded">
                  {l}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Connections */}
        {(incomingEdges.length > 0 || outgoingEdges.length > 0) && (
          <div className="border-t border-gray-100 pt-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              {t('projects.map.connections') || 'Connections'}
            </p>
            {incomingEdges.length > 0 && (
              <div className="mb-2">
                <p className="text-[10px] text-gray-400 mb-1">Incoming ({incomingEdges.length})</p>
                {incomingEdges.map((e) => (
                  <div key={e.id} className="text-xs text-gray-600 flex items-center gap-1 mb-0.5">
                    <span className="text-gray-400">&larr;</span>
                    <span className="font-medium">{e.type.replace(/_/g, ' ')}</span>
                  </div>
                ))}
              </div>
            )}
            {outgoingEdges.length > 0 && (
              <div>
                <p className="text-[10px] text-gray-400 mb-1">Outgoing ({outgoingEdges.length})</p>
                {outgoingEdges.map((e) => (
                  <div key={e.id} className="text-xs text-gray-600 flex items-center gap-1 mb-0.5">
                    <span className="text-gray-400">&rarr;</span>
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
