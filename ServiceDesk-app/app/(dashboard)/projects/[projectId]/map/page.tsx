'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Loader2, GitBranch, AlertCircle } from 'lucide-react';
import { API_URL } from '@/lib/api/config';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePmMapView } from '@/lib/domains/pm/hooks';
import { useMethodology } from '@/hooks/useMethodology';
import { ProjectHeader, ProjectNavTabs } from '@/components/projects';
import ProjectMapFilters, { type MapFilters } from '@/components/projects/ProjectMapFilters';

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
 />
 )}
 </div>
 </div>
 );
}
