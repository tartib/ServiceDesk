'use client';

/**
 * WorkflowBindingPanel — Phase 3
 *
 * UI panel for binding a FormDefinition to a workflow-engine WorkflowDefinition.
 * Rendered as a tab inside FormDefinitionBuilder (and usable standalone).
 *
 * Architecture (ADR 001):
 *   - 'simple'   → FormWorkflowService (existing, frozen)
 *   - 'advanced' → workflow-engine binding via FormWorkflowBindingService
 *   - 'none'     → no workflow
 */

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Loader2, Link2, Link2Off, CheckCircle2 } from 'lucide-react';
import api from '@/lib/axios';

type WorkflowMode = 'simple' | 'advanced' | 'none';

interface BindingStatus {
  formId: string;
  workflowMode: WorkflowMode;
  workflowDefinitionId?: string;
  isBound: boolean;
}

interface WorkflowBindingPanelProps {
  formId: string;
}

const bindingKeys = {
  status: (formId: string) => ['form-workflow-binding', formId] as const,
};

async function fetchBindingStatus(formId: string): Promise<BindingStatus> {
  const raw = await api.get<BindingStatus>(`/forms/definitions/${formId}/workflow-binding`);
  return raw as unknown as BindingStatus;
}

async function updateBinding(params: {
  formId: string;
  mode: WorkflowMode;
  workflowDefinitionId?: string;
}): Promise<BindingStatus> {
  let raw: unknown;
  if (params.mode === 'advanced' && params.workflowDefinitionId) {
    raw = await api.post<BindingStatus>(`/forms/definitions/${params.formId}/workflow-binding/bind`, {
      workflowDefinitionId: params.workflowDefinitionId,
    });
  } else if (params.mode === 'none') {
    raw = await api.post<BindingStatus>(`/forms/definitions/${params.formId}/workflow-binding/disable`);
  } else {
    raw = await api.post<BindingStatus>(`/forms/definitions/${params.formId}/workflow-binding/unbind`);
  }
  return raw as BindingStatus;
}

export default function WorkflowBindingPanel({ formId }: WorkflowBindingPanelProps) {
  const qc = useQueryClient();
  const [selectedMode, setSelectedMode] = useState<WorkflowMode>('simple');
  const [wfDefId, setWfDefId] = useState('');

  const { data: status, isLoading } = useQuery<BindingStatus>({
    queryKey: bindingKeys.status(formId),
    queryFn: async () => {
      const result = await fetchBindingStatus(formId);
      setSelectedMode(result.workflowMode ?? 'simple');
      setWfDefId(result.workflowDefinitionId ?? '');
      return result;
    },
    enabled: !!formId,
  });

  const mutation = useMutation({
    mutationFn: updateBinding,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bindingKeys.status(formId) });
    },
  });

  const handleSave = () => {
    mutation.mutate({ formId, mode: selectedMode, workflowDefinitionId: wfDefId });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const modeLabel: Record<WorkflowMode, string> = {
    simple: 'Simple workflow (built-in form workflow engine)',
    advanced: 'Advanced workflow (workflow-engine definition)',
    none: 'No workflow',
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center gap-2">
        {status?.isBound ? (
          <Badge variant="default" className="gap-1">
            <Link2 className="h-3 w-3" />
            Bound to workflow engine
          </Badge>
        ) : (
          <Badge variant="secondary" className="gap-1">
            <Link2Off className="h-3 w-3" />
            {status?.workflowMode === 'none' ? 'No workflow' : 'Simple workflow'}
          </Badge>
        )}
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-medium">Workflow mode</Label>
        <RadioGroup
          value={selectedMode}
          onValueChange={(v) => setSelectedMode(v as WorkflowMode)}
          className="space-y-2"
        >
          {(['simple', 'advanced', 'none'] as WorkflowMode[]).map((mode) => (
            <div key={mode} className="flex items-start gap-2">
              <RadioGroupItem value={mode} id={`mode-${mode}`} className="mt-0.5" />
              <Label htmlFor={`mode-${mode}`} className="text-sm cursor-pointer">
                <span className="font-medium capitalize">{mode}</span>
                <span className="block text-xs text-muted-foreground">{modeLabel[mode]}</span>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {selectedMode === 'advanced' && (
        <div className="space-y-2">
          <Label htmlFor="wf-def-id" className="text-sm font-medium">
            Workflow Definition ID
          </Label>
          <Input
            id="wf-def-id"
            placeholder="e.g. wf_approval_standard"
            value={wfDefId}
            onChange={(e) => setWfDefId(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Enter the ID of a published WorkflowDefinition from the workflow engine.
          </p>
        </div>
      )}

      {mutation.isSuccess && (
        <div className="flex items-center gap-2 text-sm text-success">
          <CheckCircle2 className="h-4 w-4" />
          Binding saved successfully
        </div>
      )}

      {mutation.isError && (
        <p className="text-sm text-destructive">
          Failed to save: {(mutation.error as Error).message}
        </p>
      )}

      <Button
        onClick={handleSave}
        disabled={mutation.isPending || (selectedMode === 'advanced' && !wfDefId.trim())}
        size="sm"
      >
        {mutation.isPending ? (
          <>
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Saving…
          </>
        ) : (
          'Save binding'
        )}
      </Button>
    </div>
  );
}
