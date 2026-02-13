'use client';

import { useState, useCallback, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Send, Check } from 'lucide-react';
import Link from 'next/link';
import { useWorkflow, useUpdateWorkflow, usePublishWorkflow } from '@/hooks/useWorkflows';
import WorkflowCanvas, { useNodesState, useEdgesState } from '@/components/workflows/WorkflowCanvas';
import NodePalette from '@/components/workflows/NodePalette';
import PropertiesPanel from '@/components/workflows/PropertiesPanel';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import type { Node, Edge } from '@xyflow/react';

export default function WorkflowEditorPage() {
  const { locale } = useLanguage();
  const params = useParams();
  const workflowId = params.id as string;

  const { data: workflow, isLoading } = useWorkflow(workflowId);
  const updateWorkflow = useUpdateWorkflow();
  const publishWorkflow = usePublishWorkflow();

  const [nodes, setNodes, onNodesChange] = useNodesState([] as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([] as Edge[]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [workflowName, setWorkflowName] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [initialized, setInitialized] = useState(false);

  // Load workflow data into canvas
  useEffect(() => {
    if (workflow && !initialized) {
      setWorkflowName(workflow.name || '');
      if (workflow.nodes && workflow.nodes.length > 0) {
        setNodes(workflow.nodes as Node[]);
      }
      if (workflow.edges && workflow.edges.length > 0) {
        setEdges(workflow.edges as Edge[]);
      }
      setInitialized(true);
    }
  }, [workflow, initialized, setNodes, setEdges]);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!workflowId) return;
    setSaveStatus('saving');
    try {
      await updateWorkflow.mutateAsync({
        id: workflowId,
        data: {
          name: workflowName,
          nodes: nodes.map((n) => ({
            id: n.id,
            type: n.type || 'process',
            position: n.position,
            data: n.data as Record<string, unknown>,
            width: n.measured?.width,
            height: n.measured?.height,
          })),
          edges: edges.map((e) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            sourceHandle: e.sourceHandle || undefined,
            targetHandle: e.targetHandle || undefined,
            type: e.type,
            animated: e.animated,
            label: typeof e.label === 'string' ? e.label : undefined,
          })),
        },
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Error saving workflow:', error);
      setSaveStatus('idle');
    }
  }, [workflowId, workflowName, nodes, edges, updateWorkflow]);

  // Handle publish
  const handlePublish = useCallback(async () => {
    await handleSave();
    try {
      await publishWorkflow.mutateAsync(workflowId);
    } catch (error) {
      console.error('Error publishing workflow:', error);
    }
  }, [handleSave, publishWorkflow, workflowId]);

  // Handle node data change from properties panel
  const handleNodeDataChange = useCallback(
    (nodeId: string, newData: Record<string, unknown>) => {
      setNodes((nds: Node[]) =>
        nds.map((n) => (n.id === nodeId ? { ...n, data: newData } : n))
      );
      // Update selected node reference
      setSelectedNode((prev) => (prev && prev.id === nodeId ? { ...prev, data: newData } : prev));
    },
    [setNodes]
  );

  // Handle edge data change from properties panel
  const handleEdgeDataChange = useCallback(
    (edgeId: string, changes: Partial<Edge>) => {
      setEdges((eds: Edge[]) =>
        eds.map((e) => (e.id === edgeId ? { ...e, ...changes } : e))
      );
      setSelectedEdge((prev) => (prev && prev.id === edgeId ? { ...prev, ...changes } : prev));
    },
    [setEdges]
  );

  // Keep selectedNode in sync with nodes state
  const handleNodeSelect = useCallback((node: Node | null) => {
    setSelectedNode(node);
  }, []);

  const handleEdgeSelect = useCallback((edge: Edge | null) => {
    setSelectedEdge(edge);
  }, []);

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="flex h-screen items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!workflow && !isLoading) {
    return (
      <ProtectedRoute>
        <div className="flex h-screen items-center justify-center bg-gray-50">
          <div className="text-center">
            <p className="text-lg text-gray-500 mb-4">
              {locale === 'ar' ? 'سير العمل غير موجود' : 'Workflow not found'}
            </p>
            <Link href="/workflows">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 me-2" />
                {locale === 'ar' ? 'رجوع' : 'Go Back'}
              </Button>
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-screen bg-gray-50">
        {/* Top Bar */}
        <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            <Link href="/workflows">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <Input
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="h-8 w-64 text-sm font-medium border-transparent hover:border-gray-300 focus:border-blue-500"
              placeholder={locale === 'ar' ? 'اسم سير العمل' : 'Workflow name'}
            />
            {workflow && (
              <Badge variant={workflow.status === 'published' ? 'default' : 'secondary'}>
                {workflow.status === 'draft' && (locale === 'ar' ? 'مسودة' : 'Draft')}
                {workflow.status === 'published' && (locale === 'ar' ? 'منشور' : 'Published')}
                {workflow.status === 'archived' && (locale === 'ar' ? 'مؤرشف' : 'Archived')}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
            >
              {saveStatus === 'saving' ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current me-2" />
                  {locale === 'ar' ? 'جاري الحفظ...' : 'Saving...'}
                </>
              ) : saveStatus === 'saved' ? (
                <>
                  <Check className="h-4 w-4 me-2 text-green-600" />
                  {locale === 'ar' ? 'تم الحفظ' : 'Saved'}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 me-2" />
                  {locale === 'ar' ? 'حفظ' : 'Save'}
                </>
              )}
            </Button>
            {workflow?.status === 'draft' && (
              <Button size="sm" onClick={handlePublish}>
                <Send className="h-4 w-4 me-2" />
                {locale === 'ar' ? 'نشر' : 'Publish'}
              </Button>
            )}
          </div>
        </div>

        {/* Main Area: Palette + Canvas + Properties */}
        <div className="flex flex-1 overflow-hidden">
          <NodePalette />
          <WorkflowCanvas
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            setNodes={setNodes}
            setEdges={setEdges}
            onNodeSelect={handleNodeSelect}
            onEdgeSelect={handleEdgeSelect}
          />
          <PropertiesPanel
            selectedNode={selectedNode}
            selectedEdge={selectedEdge}
            onNodeChange={handleNodeDataChange}
            onEdgeChange={handleEdgeDataChange}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
}
