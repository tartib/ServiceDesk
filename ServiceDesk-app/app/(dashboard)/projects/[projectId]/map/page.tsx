'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Loader2, GitBranch, AlertCircle } from 'lucide-react';
import { API_URL } from '@/lib/api/config';
import { projectApi } from '@/lib/domains/pm/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePmMapView } from '@/lib/domains/pm/hooks';
import { useMethodology } from '@/hooks/useMethodology';
import { ProjectHeader, ProjectNavTabs, TaskDetailPanel } from '@/components/projects';
import ProjectMapFilters, { type MapFilters } from '@/components/projects/ProjectMapFilters';
import type { MapNodeDataDTO } from '@/lib/domains/pm/dto';

const ProjectMapCanvas = dynamic(
 () => import('@/components/projects/ProjectMapCanvas'),
 {
 ssr: false,
 loading: () => (
 <div className="flex items-center justify-center h-full">
 <Loader2 className="h-6 w-6 text-brand animate-spin" />
 </div>
 ),
 }
);

export default function ProjectMapPage() {
 const params = useParams();
 const projectId = params.projectId as string;
 const { t } = useLanguage();
 const { methodology } = useMethodology(projectId);
 const [filters, setFilters] = useState<MapFilters>({});
 const [project, setProject] = useState<{ key?: string; name?: string } | null>(null);
 const [labelMap, setLabelMap] = useState<Record<string, string>>({});

 // Task detail panel state
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 const [selectedTask, setSelectedTask] = useState<any>(null);
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 const [taskDetail, setTaskDetail] = useState<any>(null);
 const [showTaskDetail, setShowTaskDetail] = useState(false);

 const fetchProject = useCallback(async () => {
 const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
 if (!token) return;
 try {
 const res = await fetch(`${API_URL}/pm/projects/${projectId}`, {
 headers: { Authorization: `Bearer ${token}` },
 });
 const json = await res.json();
 if (json.success) setProject(json.data.project);
 } catch { /* ignore */ }
 }, [projectId]);

 useEffect(() => { fetchProject(); }, [fetchProject]);

 // Handle node selection → fetch full task detail for TaskDetailPanel
 const handleNodeSelect = useCallback(async (nodeId: string | null, nodeData: MapNodeDataDTO | null) => {
 if (!nodeId || !nodeData) {
 setShowTaskDetail(false);
 setSelectedTask(null);
 setTaskDetail(null);
 return;
 }
 // Build a minimal task object from node data so the panel can render immediately
 setSelectedTask({
 _id: nodeId,
 key: nodeData.key,
 title: nodeData.title,
 type: nodeData.type,
 priority: nodeData.priority,
 status: { id: '', name: nodeData.status, category: nodeData.statusCategory },
 assignee: nodeData.assigneeName ? { _id: nodeData.assigneeId || '', profile: { firstName: nodeData.assigneeName } } : undefined,
 storyPoints: nodeData.storyPoints,
 labels: nodeData.labels,
 });
 setShowTaskDetail(true);

 // Fetch full detail
 const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
 if (!token) return;
 try {
 const res = await fetch(`${API_URL}/pm/projects/${projectId}/tasks/${nodeId}`, {
 headers: { Authorization: `Bearer ${token}` },
 });
 const json = await res.json();
 if (json.success) {
 const detail = json.data?.task || json.data;
 setSelectedTask(detail);
 setTaskDetail(detail);
 }
 } catch { /* ignore */ }
 }, [projectId]);

 const closeTaskDetail = useCallback(() => {
 setShowTaskDetail(false);
 setSelectedTask(null);
 setTaskDetail(null);
 }, []);

 const refreshTasks = useCallback(() => {
 // Refetch map data by re-triggering the query (usePmMapView will invalidate)
 }, []);

 // Fetch project labels to resolve IDs → names
 useEffect(() => {
 projectApi.getLabels(projectId).then((res) => {
 const r = res as Record<string, unknown>;
 const nested = r?.data as Record<string, unknown> | undefined;
 const labels = (nested?.labels || r?.labels || r || []) as Array<{ _id: string; name: string }>;
 const map: Record<string, string> = {};
 if (Array.isArray(labels)) {
 labels.forEach((l: { _id: string; name: string }) => { map[l._id] = l.name; });
 }
 setLabelMap(map);
 }).catch(() => { /* ignore */ });
 }, [projectId]);

 // Build query filters (strip empty values)
 const queryFilters = useMemo(() => {
 const clean: Record<string, string> = {};
 Object.entries(filters).forEach(([k, v]) => {
 if (v) clean[k] = v;
 });
 return Object.keys(clean).length > 0 ? clean : undefined;
 }, [filters]);

 const { data, isLoading, error } = usePmMapView(projectId, queryFilters);

 // Extract unique labels and assignees from data for filter dropdowns
 const availableLabels = useMemo(() => {
 if (!data?.nodes) return [];
 const labels = new Set<string>();
 data.nodes.forEach((n) => n.data?.labels?.forEach((l: string) => labels.add(l)));
 return Array.from(labels).sort();
 }, [data]);

 const availableAssignees = useMemo(() => {
 if (!data?.nodes) return [];
 const map = new Map<string, string>();
 data.nodes.forEach((n) => {
 if (n.data?.assigneeId && n.data?.assigneeName) {
 map.set(n.data.assigneeId, n.data.assigneeName);
 }
 });
 return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
 }, [data]);

 return (
 <div className="flex flex-col h-full">
 {/* Project Header & Navigation */}
 <ProjectHeader projectKey={project?.key} projectName={project?.name} projectId={projectId} />
 <ProjectNavTabs projectId={projectId} methodology={methodology || 'scrum'} />

 {/* Map sub-header */}
 <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background">
 <div className="flex items-center gap-2">
 <GitBranch className="h-4 w-4 text-muted-foreground" />
 <h2 className="text-sm font-semibold text-foreground">
 {t('projects.map.title') || 'Map View'}
 </h2>
 {data && (
 <span className="text-xs text-muted-foreground">
 {data.nodes.length} {t('common.tasks') || 'tasks'} · {data.edges.length} {t('projects.map.connections') || 'connections'}
 </span>
 )}
 </div>
 <ProjectMapFilters
 filters={filters}
 onChange={setFilters}
 availableLabels={availableLabels}
 availableAssignees={availableAssignees}
 />
 </div>

 {/* Canvas + Detail Panel — side by side */}
 <div className="flex flex-1 overflow-hidden">
 {/* Canvas area */}
 <div className="flex-1 relative bg-muted/50">
 {isLoading && (
 <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-20">
 <div className="flex flex-col items-center gap-2">
 <Loader2 className="h-8 w-8 text-brand animate-spin" />
 <p className="text-sm text-muted-foreground">{t('common.loading') || 'Loading map...'}</p>
 </div>
 </div>
 )}

 {error && (
 <div className="absolute inset-0 flex items-center justify-center">
 <div className="flex flex-col items-center gap-2 text-center">
 <AlertCircle className="h-8 w-8 text-destructive" />
 <p className="text-sm text-destructive">{t('common.error') || 'Failed to load map view'}</p>
 <p className="text-xs text-muted-foreground">{(error as Error)?.message}</p>
 </div>
 </div>
 )}

 {!isLoading && !error && data && data.nodes.length === 0 && (
 <div className="absolute inset-0 flex items-center justify-center">
 <div className="flex flex-col items-center gap-2 text-center">
 <GitBranch className="h-10 w-10 text-muted-foreground" />
 <p className="text-sm font-medium text-muted-foreground">
 {t('projects.map.empty') || 'No tasks to display'}
 </p>
 <p className="text-xs text-muted-foreground">
 {t('projects.map.emptyHint') || 'Create tasks or adjust your filters to see the map'}
 </p>
 </div>
 </div>
 )}

 {!isLoading && !error && data && data.nodes.length > 0 && (
 <ProjectMapCanvas
 mapNodes={data.nodes}
 mapEdges={data.edges}
 projectId={projectId}
 labelMap={labelMap}
 onNodeSelect={handleNodeSelect}
 />
 )}
 </div>

 {/* Task Detail Panel — slides in from end */}
 {showTaskDetail && selectedTask && (
 <TaskDetailPanel
 task={selectedTask as React.ComponentProps<typeof TaskDetailPanel>['task']}
 taskDetail={taskDetail as React.ComponentProps<typeof TaskDetailPanel>['taskDetail']}
 projectId={projectId}
 onClose={closeTaskDetail}
 onTaskUpdate={refreshTasks}
 />
 )}
 </div>
 </div>
 );
}
