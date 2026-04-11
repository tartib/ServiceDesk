'use client';

import { useCallback, useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { API_BASE_URL, API_URL } from '@/lib/api/config';
import { getOrganizationId, setOrganizationId } from '@/lib/api/organization-context';

const WF_API = `${API_BASE_URL}/api/v2/workflow-engine/definitions`;

const WorkflowBuilder = dynamic(
  () => import('@/components/workflow-builder/WorkflowBuilder'),
  { ssr: false }
);

// ============================================
// Node type → WFStateType mapping
// ============================================

const NODE_TYPE_MAP: Record<string, string> = {
  wfStart: 'start',
  wfEnd: 'end',
  wfState: 'normal',
  wfApproval: 'normal',
  wfCondition: 'normal',
  wfFork: 'fork',
  wfJoin: 'join',
  wfTimer: 'normal',
  wfExternalTask: 'external_task',
};

// ============================================
// Serializer: ReactFlow → API payload
// ============================================

interface RFNode {
  id: string;
  type?: string;
  data: Record<string, unknown>;
  position: { x: number; y: number };
}

interface RFEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
  data?: Record<string, unknown>;
}

function serializeDefinition(nodes: RFNode[], edges: RFEdge[], name: string) {
  // Build a map from node id → code (used for transitions and initial/final states)
  const codeOf = (node: RFNode) => {
    const d = node.data || {};
    return d.code ? String(d.code) : node.id;
  };
  const idToCode = new Map(nodes.map((n) => [n.id, codeOf(n)]));

  // Build states from nodes
  const states = nodes.map((node, idx) => {
    const d = node.data || {};
    return {
      code: codeOf(node),
      name: String(d.label || node.type || 'State'),
      nameAr: d.nameAr ? String(d.nameAr) : undefined,
      type: NODE_TYPE_MAP[node.type || ''] || 'normal',
      category: String(d.category || 'in_progress'),
      order: idx,
      color: d.color ? String(d.color) : undefined,
      onEnter: Array.isArray(d.onEnter) ? d.onEnter : [],
      onExit: Array.isArray(d.onExit) ? d.onExit : [],
      sla: d.sla || undefined,
      joinStrategy: d.joinStrategy ? String(d.joinStrategy) : undefined,
      joinCount: d.joinCount ? Number(d.joinCount) : undefined,
      position: node.position,
    };
  });

  // Build transitions from edges
  const transitions = edges.map((edge) => {
    const d = edge.data || {};
    const transitionName = edge.label ? String(edge.label) : `${idToCode.get(edge.source) || edge.source} → ${idToCode.get(edge.target) || edge.target}`;
    return {
      transitionId: edge.id,
      name: transitionName,
      nameAr: d.nameAr ? String(d.nameAr) : undefined,
      description: d.description ? String(d.description) : undefined,
      fromState: idToCode.get(edge.source) || edge.source,
      toState: idToCode.get(edge.target) || edge.target,
      trigger: 'manual',
      guards: Array.isArray(d.guards) ? d.guards : [],
      validators: Array.isArray(d.validators) ? d.validators : [],
      actions: Array.isArray(d.actions) ? d.actions : [],
      onTransition: [],
      ui: {
        buttonLabel: edge.label ? String(edge.label) : transitionName,
        buttonLabelAr: d.nameAr ? String(d.nameAr) : undefined,
        ...(d.ui && typeof d.ui === 'object' ? d.ui as Record<string, unknown> : {}),
      },
    };
  });

  // Find initial and final states
  const startNode = nodes.find((n) => n.type === 'wfStart');
  const endNodes = nodes.filter((n) => n.type === 'wfEnd');

  return {
    name,
    organizationId: getOrganizationId() || undefined,
    entityType: 'ticket',
    states,
    transitions,
    initialState: startNode ? codeOf(startNode) : states[0]?.code || '',
    finalStates: endNodes.map((n) => codeOf(n)),
    settings: {
      allowParallelSteps: false,
      requireCommentsOnReject: false,
    },
  };
}

export default function WorkflowBuilderPage() {
  const { locale } = useLanguage();
  const router = useRouter();
  const isAr = locale === 'ar';

  // Track the saved definition ID so subsequent saves update instead of creating
  const [definitionId, setDefinitionId] = useState<string | null>(null);
  const busyRef = useRef(false);

  // Resolve organizationId via centralized context, fallback to /me fetch
  const orgPromiseRef = useRef<Promise<string | null> | null>(null);

  const ensureOrgId = useCallback(async (): Promise<string | null> => {
    const cached = getOrganizationId();
    if (cached) return cached;

    if (!orgPromiseRef.current) {
      orgPromiseRef.current = (async () => {
        const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
        if (!token) return null;
        try {
          const res = await fetch(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const json = await res.json();
          const orgs = json?.data?.user?.organizations;
          if (Array.isArray(orgs) && orgs.length > 0) {
            const id = typeof orgs[0].organizationId === 'object'
              ? orgs[0].organizationId._id
              : orgs[0].organizationId;
            if (id) {
              setOrganizationId(id);
              return id as string;
            }
          }
        } catch { /* ignore */ }
        return null;
      })();
    }
    return orgPromiseRef.current;
  }, []);

  // Eagerly fetch on mount so it's ready when the user clicks Save/Publish
  useEffect(() => { ensureOrgId(); }, [ensureOrgId]);

  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    const orgId = await ensureOrgId();
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) h['Authorization'] = `Bearer ${token}`;
    if (orgId) h['X-Organization-ID'] = orgId;
    return h;
  }, [ensureOrgId]);

  // -----------------------------------------------
  // Save (create draft or update existing)
  // -----------------------------------------------
  const handleSave = useCallback(
    async (data: { nodes: unknown[]; edges: unknown[]; name: string }) => {
      if (busyRef.current) return;
      busyRef.current = true;

      const headers = await getAuthHeaders();
      if (!headers['Authorization']) {
        toast.error(isAr ? 'يرجى تسجيل الدخول أولاً' : 'Please log in first');
        busyRef.current = false;
        return;
      }

      const payload = serializeDefinition(
        data.nodes as RFNode[],
        data.edges as RFEdge[],
        data.name
      );

      try {
        let res: Response;

        if (definitionId) {
          // Update existing definition
          res = await fetch(`${WF_API}/${definitionId}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(payload),
          });
        } else {
          // Create new definition
          res = await fetch(WF_API, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
          });
        }

        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(json.message || `HTTP ${res.status}`);
        }

        // Store the created/updated ID
        const savedId = json.data?.definition?._id || json.data?._id || definitionId;
        if (savedId) setDefinitionId(savedId);

        toast.success(isAr ? 'تم حفظ سير العمل بنجاح' : 'Workflow saved successfully');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        console.error('[WorkflowBuilder] Save failed:', msg);
        toast.error(isAr ? `فشل الحفظ: ${msg}` : `Save failed: ${msg}`);
      } finally {
        busyRef.current = false;
      }
    },
    [definitionId, isAr, getAuthHeaders]
  );

  // -----------------------------------------------
  // Publish (save first, then publish)
  // -----------------------------------------------
  const handlePublish = useCallback(
    async (data: { nodes: unknown[]; edges: unknown[]; name: string }) => {
      if (busyRef.current) return;
      busyRef.current = true;

      const headers = await getAuthHeaders();
      if (!headers['Authorization']) {
        toast.error(isAr ? 'يرجى تسجيل الدخول أولاً' : 'Please log in first');
        busyRef.current = false;
        return;
      }

      const payload = serializeDefinition(
        data.nodes as RFNode[],
        data.edges as RFEdge[],
        data.name
      );

      try {
        // Step 1: Save (create or update)
        let savedId = definitionId;

        if (savedId) {
          const updateRes = await fetch(`${WF_API}/${savedId}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(payload),
          });
          const updateJson = await updateRes.json();
          if (!updateRes.ok || !updateJson.success) {
            throw new Error(updateJson.message || `HTTP ${updateRes.status}`);
          }
        } else {
          const createRes = await fetch(WF_API, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
          });
          const createJson = await createRes.json();
          if (!createRes.ok || !createJson.success) {
            throw new Error(createJson.message || `HTTP ${createRes.status}`);
          }
          savedId = createJson.data?.definition?._id || createJson.data?._id;
          if (savedId) setDefinitionId(savedId);
        }

        if (!savedId) {
          throw new Error('No definition ID returned');
        }

        // Step 2: Publish
        const publishRes = await fetch(`${WF_API}/${savedId}/publish`, {
          method: 'POST',
          headers,
        });
        const publishJson = await publishRes.json();
        if (!publishRes.ok || !publishJson.success) {
          throw new Error(publishJson.message || `HTTP ${publishRes.status}`);
        }

        toast.success(isAr ? 'تم نشر سير العمل بنجاح!' : 'Workflow published successfully!');

        // Navigate to the workflows list after a short delay
        setTimeout(() => {
          router.push('/workflows');
        }, 1200);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        console.error('[WorkflowBuilder] Publish failed:', msg);
        toast.error(isAr ? `فشل النشر: ${msg}` : `Publish failed: ${msg}`);
      } finally {
        busyRef.current = false;
      }
    },
    [definitionId, isAr, router, getAuthHeaders]
  );

  return (
    <div className="h-[calc(100vh-64px)]">
      <WorkflowBuilder
        onSave={handleSave}
        onPublish={handlePublish}
        definitionName={isAr ? 'سير عمل جديد' : 'New Workflow'}
      />
    </div>
  );
}
