'use client';

import { useCallback, useRef, useState, DragEvent } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Node,
  type Edge,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useLanguage } from '@/contexts/LanguageContext';
import { Save, Zap } from 'lucide-react';
import { wfNodeTypes } from './nodes/BPMNNodes';
import WFNodePalette from './panels/WFNodePalette';
import WFPropertiesPanel from './panels/WFPropertiesPanel';

// ============================================
// Types
// ============================================

interface WorkflowBuilderProps {
  definitionId?: string;
  initialNodes?: Node[];
  initialEdges?: Edge[];
  definitionName?: string;
  onSave?: (data: { nodes: Node[]; edges: Edge[]; name: string }) => void;
  onPublish?: (data: { nodes: Node[]; edges: Edge[]; name: string }) => void;
}

// ============================================
// Helpers
// ============================================

let idCounter = 0;
const getId = () => `wf_${Date.now()}_${idCounter++}`;

const defaultLabels: Record<string, string> = {
  wfStart: 'Start',
  wfEnd: 'End',
  wfState: 'New State',
  wfApproval: 'Approval',
  wfCondition: 'Condition',
  wfFork: 'Fork',
  wfJoin: 'Join',
  wfTimer: 'Timer',
};

const defaultNodeData: Record<string, Record<string, unknown>> = {
  wfState: { label: 'New State', code: '', category: 'in_progress', color: '#3B82F6' },
  wfApproval: { label: 'Approval', code: '', category: 'in_progress', color: '#8B5CF6' },
  wfCondition: {},
  wfFork: {},
  wfJoin: { joinStrategy: 'all' },
  wfTimer: { hours: 24 },
  wfStart: {},
  wfEnd: {},
};

// ============================================
// Inner Canvas Component
// ============================================

function WorkflowBuilderInner({
  initialNodes = [],
  initialEdges = [],
  definitionName = '',
  onSave,
  onPublish,
}: WorkflowBuilderProps) {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [name, setName] = useState(definitionName);

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reactFlowInstance = useRef<any>(null);

  // ============================================
  // Canvas handlers
  // ============================================

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds: Edge[]) =>
        addEdge(
          {
            ...params,
            animated: false,
            label: '',
            style: { strokeWidth: 2 },
          },
          eds
        )
      );
    },
    [setEdges]
  );

  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type || !reactFlowInstance.current) return;

      const position = reactFlowInstance.current.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: getId(),
        type,
        position,
        data: {
          label: defaultLabels[type] || type,
          ...defaultNodeData[type],
        },
      };

      setNodes((nds: Node[]) => [...nds, newNode]);
    },
    [setNodes]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNode(node);
      setSelectedEdge(null);
    },
    []
  );

  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      setSelectedEdge(edge);
      setSelectedNode(null);
    },
    []
  );

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
  }, []);

  // ============================================
  // Property change handlers
  // ============================================

  const handleNodeChange = useCallback(
    (id: string, data: Record<string, unknown>) => {
      setNodes((nds: Node[]) =>
        nds.map((n) => (n.id === id ? { ...n, data } : n))
      );
      setSelectedNode((prev) => (prev?.id === id ? { ...prev, data } : prev));
    },
    [setNodes]
  );

  const handleEdgeChange = useCallback(
    (id: string, data: Partial<Edge>) => {
      setEdges((eds: Edge[]) =>
        eds.map((e) => (e.id === id ? { ...e, ...data } : e))
      );
      setSelectedEdge((prev) =>
        prev?.id === id ? { ...prev, ...data } as Edge : prev
      );
    },
    [setEdges]
  );

  const handleDeleteNode = useCallback(
    (id: string) => {
      setNodes((nds: Node[]) => nds.filter((n) => n.id !== id));
      setEdges((eds: Edge[]) => eds.filter((e) => e.source !== id && e.target !== id));
      setSelectedNode(null);
    },
    [setNodes, setEdges]
  );

  const handleDeleteEdge = useCallback(
    (id: string) => {
      setEdges((eds: Edge[]) => eds.filter((e) => e.id !== id));
      setSelectedEdge(null);
    },
    [setEdges]
  );

  // ============================================
  // Save / Publish
  // ============================================

  const handleSave = useCallback(() => {
    if (onSave) {
      onSave({ nodes, edges, name });
    }
  }, [onSave, nodes, edges, name]);

  const handlePublish = useCallback(() => {
    if (onPublish) {
      onPublish({ nodes, edges, name });
    }
  }, [onPublish, nodes, edges, name]);

  // ============================================
  // Render
  // ============================================

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={isAr ? 'اسم سير العمل...' : 'Workflow name...'}
            className="text-sm font-semibold text-gray-800 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-1 py-0.5 w-64"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            {isAr ? 'حفظ' : 'Save'}
          </button>
          <button
            onClick={handlePublish}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Zap className="w-4 h-4" />
            {isAr ? 'نشر' : 'Publish'}
          </button>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Node Palette */}
        <WFNodePalette />

        {/* Center: Canvas */}
        <div ref={reactFlowWrapper} className="flex-1 h-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onInit={(instance: any) => {
              reactFlowInstance.current = instance;
            }}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onPaneClick={onPaneClick}
            nodeTypes={wfNodeTypes}
            fitView
            deleteKeyCode={['Backspace', 'Delete']}
            className="bg-gray-50"
            defaultEdgeOptions={{
              style: { strokeWidth: 2, stroke: '#94A3B8' },
              type: 'smoothstep',
            }}
          >
            <Controls position="bottom-left" className="!bg-white !border-gray-200 !shadow-sm" />
            <MiniMap
              nodeStrokeWidth={3}
              className="!bg-white !border-gray-200 !shadow-sm"
              position="bottom-right"
            />
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color="#CBD5E1"
            />
          </ReactFlow>
        </div>

        {/* Right Panel: Properties */}
        <WFPropertiesPanel
          selectedNode={selectedNode}
          selectedEdge={selectedEdge}
          onNodeChange={handleNodeChange}
          onEdgeChange={handleEdgeChange}
          onDeleteNode={handleDeleteNode}
          onDeleteEdge={handleDeleteEdge}
        />
      </div>
    </div>
  );
}

// ============================================
// Exported Wrapper
// ============================================

export default function WorkflowBuilder(props: WorkflowBuilderProps) {
  return (
    <ReactFlowProvider>
      <WorkflowBuilderInner {...props} />
    </ReactFlowProvider>
  );
}
