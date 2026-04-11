'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ReactFlow,
  MiniMap,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  type Node,
  type Edge,
  type NodeMouseHandler,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import type { MapNodeDTO, MapEdgeDTO, MapNodeDataDTO } from '@/lib/domains/pm/dto';
import ProjectMapNode from './ProjectMapNode';
import ProjectMapToolbar from './ProjectMapToolbar';
import ProjectMapLegend from './ProjectMapLegend';
import ProjectMapDetailsDrawer from './ProjectMapDetailsDrawer';

// ── Custom node types ──────────────────────────────────────────
const nodeTypes = { taskNode: ProjectMapNode };

// ── Edge styling by relation type ──────────────────────────────
const edgeStyleMap: Record<string, { stroke: string; strokeDasharray?: string; animated?: boolean }> = {
  parent: { stroke: '#6366f1' },
  depends_on: { stroke: '#f59e0b', strokeDasharray: '6,3' },
  blocked_by: { stroke: '#ef4444', strokeDasharray: '6,3', animated: true },
  related_to: { stroke: '#9ca3af', strokeDasharray: '2,2' },
};

const edgeMarkerMap: Record<string, MarkerType> = {
  parent: MarkerType.ArrowClosed,
  depends_on: MarkerType.ArrowClosed,
  blocked_by: MarkerType.ArrowClosed,
  related_to: MarkerType.Arrow,
};

// ── Dagre auto-layout ──────────────────────────────────────────
const NODE_WIDTH = 220;
const NODE_HEIGHT = 100;

function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  direction: 'TB' | 'LR' = 'TB'
): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, nodesep: 60, ranksep: 80 });

  nodes.forEach((node) => {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = g.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - NODE_HEIGHT / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

// ── Transform DTOs → ReactFlow elements ────────────────────────
function toFlowNodes(mapNodes: MapNodeDTO[]): Node[] {
  return mapNodes.map((n) => ({
    id: n.id,
    type: 'taskNode',
    position: { x: 0, y: 0 },
    data: n.data as unknown as Record<string, unknown>,
  }));
}

function toFlowEdges(mapEdges: MapEdgeDTO[]): Edge[] {
  return mapEdges.map((e) => {
    const style = edgeStyleMap[e.type] || edgeStyleMap.related_to;
    return {
      id: e.id,
      source: e.source,
      target: e.target,
      type: 'default',
      animated: style.animated || false,
      style: {
        stroke: style.stroke,
        strokeWidth: 2,
        strokeDasharray: style.strokeDasharray,
      },
      markerEnd: {
        type: edgeMarkerMap[e.type] || MarkerType.Arrow,
        color: style.stroke,
      },
      data: { relationType: e.type },
    };
  });
}

// ── Inner canvas (needs ReactFlowProvider) ─────────────────────
interface InnerCanvasProps {
  mapNodes: MapNodeDTO[];
  mapEdges: MapEdgeDTO[];
  projectId: string;
}

function InnerCanvas({ mapNodes, mapEdges, projectId }: InnerCanvasProps) {
  const { fitView, zoomIn, zoomOut } = useReactFlow();
  const [orientation, setOrientation] = useState<'TB' | 'LR'>('TB');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Compute layout
  const { layoutedNodes, layoutedEdges } = useMemo(() => {
    const flowNodes = toFlowNodes(mapNodes);
    const flowEdges = toFlowEdges(mapEdges);
    const result = getLayoutedElements(flowNodes, flowEdges, orientation);
    return { layoutedNodes: result.nodes, layoutedEdges: result.edges };
  }, [mapNodes, mapEdges, orientation]);

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  // Re-layout when data or orientation changes
  useEffect(() => {
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
    // Fit view after layout
    setTimeout(() => fitView({ padding: 0.15, duration: 300 }), 50);
  }, [layoutedNodes, layoutedEdges, setNodes, setEdges, fitView]);

  // Node click → select + highlight
  const onNodeClick: NodeMouseHandler = useCallback((_event, node) => {
    setSelectedNodeId(node.id);
  }, []);

  // Highlight connected nodes/edges
  const connectedNodeIds = useMemo(() => {
    if (!selectedNodeId) return new Set<string>();
    const ids = new Set<string>();
    ids.add(selectedNodeId);
    mapEdges.forEach((e) => {
      if (e.source === selectedNodeId) ids.add(e.target);
      if (e.target === selectedNodeId) ids.add(e.source);
    });
    return ids;
  }, [selectedNodeId, mapEdges]);

  // Apply dimming to non-connected nodes
  const styledNodes = useMemo(() => {
    if (!selectedNodeId) return nodes;
    return nodes.map((n) => ({
      ...n,
      style: {
        ...n.style,
        opacity: connectedNodeIds.has(n.id) ? 1 : 0.3,
        transition: 'opacity 0.2s ease',
      },
    }));
  }, [nodes, selectedNodeId, connectedNodeIds]);

  const styledEdges = useMemo(() => {
    if (!selectedNodeId) return edges;
    return edges.map((e) => ({
      ...e,
      style: {
        ...e.style,
        opacity: e.source === selectedNodeId || e.target === selectedNodeId ? 1 : 0.15,
        transition: 'opacity 0.2s ease',
      },
    }));
  }, [edges, selectedNodeId]);

  // Selected node data for drawer
  const selectedNodeData = useMemo<MapNodeDataDTO | null>(() => {
    if (!selectedNodeId) return null;
    const found = mapNodes.find((n) => n.id === selectedNodeId);
    return found?.data || null;
  }, [selectedNodeId, mapNodes]);

  const selectedEdges = useMemo(() => {
    if (!selectedNodeId) return [];
    return mapEdges.filter((e) => e.source === selectedNodeId || e.target === selectedNodeId);
  }, [selectedNodeId, mapEdges]);

  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  return (
    <div className="relative w-full h-full">
      <ReactFlow
        nodes={styledNodes}
        edges={styledEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        nodesDraggable={false}
        nodesConnectable={false}
        proOptions={{ hideAttribution: true }}
        minZoom={0.1}
        maxZoom={2}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#e5e7eb" />
        <MiniMap
          nodeStrokeWidth={3}
          nodeColor={(node) => {
            const data = node.data as unknown as MapNodeDataDTO;
            if (data.statusCategory === 'done') return '#22c55e';
            if (data.statusCategory === 'in_progress') return '#3b82f6';
            return '#d1d5db';
          }}
          className="!bg-white/80 !border-gray-200"
          pannable
          zoomable
        />
      </ReactFlow>

      {/* Toolbar — top left */}
      <div className="absolute top-3 left-3 z-10">
        <ProjectMapToolbar
          onFitView={() => fitView({ padding: 0.15, duration: 300 })}
          onZoomIn={() => zoomIn({ duration: 200 })}
          onZoomOut={() => zoomOut({ duration: 200 })}
          orientation={orientation}
          onToggleOrientation={() => setOrientation((o) => (o === 'TB' ? 'LR' : 'TB'))}
        />
      </div>

      {/* Legend — bottom left */}
      <div className="absolute bottom-3 left-3 z-10">
        <ProjectMapLegend />
      </div>

      {/* Details drawer — right side */}
      <ProjectMapDetailsDrawer
        nodeId={selectedNodeId}
        nodeData={selectedNodeData}
        connectedEdges={selectedEdges}
        projectId={projectId}
        onClose={() => setSelectedNodeId(null)}
      />
    </div>
  );
}

// ── Exported wrapper with Provider ─────────────────────────────
interface ProjectMapCanvasProps {
  mapNodes: MapNodeDTO[];
  mapEdges: MapEdgeDTO[];
  projectId: string;
}

export default function ProjectMapCanvas({ mapNodes, mapEdges, projectId }: ProjectMapCanvasProps) {
  return (
    <ReactFlowProvider>
      <InnerCanvas mapNodes={mapNodes} mapEdges={mapEdges} projectId={projectId} />
    </ReactFlowProvider>
  );
}
