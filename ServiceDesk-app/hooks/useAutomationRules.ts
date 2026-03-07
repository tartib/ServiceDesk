import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

// ============================================
// Types — mirrors backend AutomationRule model
// ============================================

export type AutomationRuleStatus = 'active' | 'inactive' | 'draft' | 'deprecated';

export type RuleTriggerType =
  | 'ticket_created' | 'ticket_updated' | 'status_changed'
  | 'priority_changed' | 'assignment_changed'
  | 'sla_breach_warning' | 'sla_breached'
  | 'time_trigger' | 'scheduled'
  | 'webhook_received' | 'email_received'
  | 'custom_event' | 'user_action';

export type RuleActionType =
  | 'assign_ticket' | 'set_priority' | 'set_status'
  | 'add_tag' | 'remove_tag' | 'add_comment'
  | 'notify_user' | 'notify_team' | 'send_email'
  | 'execute_webhook' | 'create_task' | 'create_incident'
  | 'link_tickets' | 'merge_tickets' | 'set_field'
  | 'run_script' | 'execute_workflow'
  | 'route_to_queue' | 'request_approval';

export type RuleOperator =
  | 'equals' | 'not_equals' | 'contains' | 'not_contains'
  | 'starts_with' | 'ends_with'
  | 'greater_than' | 'less_than' | 'greater_or_equal' | 'less_or_equal'
  | 'in' | 'not_in' | 'is_empty' | 'is_not_empty'
  | 'matches_regex' | 'is_true' | 'is_false';

export interface RuleCondition {
  field: string;
  operator: RuleOperator;
  value: unknown;
  valueType: 'string' | 'number' | 'boolean' | 'date' | 'array';
}

export interface RuleConditionGroup {
  operator: 'AND' | 'OR';
  conditions: RuleCondition[];
}

export interface RuleAction {
  order: number;
  type: RuleActionType;
  config: Record<string, unknown>;
  delayMinutes?: number;
  stopOnFailure: boolean;
  condition?: {
    field: string;
    operator: RuleOperator;
    value: unknown;
  };
}

export interface IAutomationRule {
  _id: string;
  ruleId: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  status: AutomationRuleStatus;
  organizationId?: string;
  department?: string;
  trigger: {
    type: RuleTriggerType;
    config: Record<string, unknown>;
    filters?: Array<{
      field: string;
      operator: RuleOperator;
      value: unknown;
    }>;
  };
  conditions: {
    operator: 'AND' | 'OR';
    groups: RuleConditionGroup[];
  };
  actions: RuleAction[];
  execution: {
    maxExecutionsPerTicket: number;
    preventReTrigger: boolean;
    reTriggerDelayMinutes?: number;
    allowParallel: boolean;
    queueName?: string;
    priority: number;
  };
  schedule?: {
    cron: string;
    timezone: string;
    enabled: boolean;
    lastRun?: string;
    nextRun?: string;
  };
  scope: {
    ticketTypes: string[];
    services: string[];
    categories: string[];
    priorities: string[];
    applyTo: 'all' | 'specific';
  };
  stats: {
    executionCount: number;
    successCount: number;
    failureCount: number;
    lastExecutedAt?: string;
    lastExecutionStatus?: 'success' | 'failed' | 'partial';
    averageExecutionTimeMs: number;
  };
  isValid: boolean;
  validationErrors?: string[];
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface IRuleExecutionLog {
  _id: string;
  ruleId: string;
  ruleName: string;
  triggerTicketId?: string;
  triggerType: RuleTriggerType;
  status: 'success' | 'failed' | 'partial' | 'skipped';
  startedAt: string;
  completedAt?: string;
  durationMs: number;
  conditionResults?: Array<{
    groupIndex: number;
    conditionIndex: number;
    field: string;
    operator: string;
    expected: unknown;
    actual: unknown;
    passed: boolean;
  }>;
  actionResults?: Array<{
    order: number;
    type: string;
    status: 'success' | 'failed' | 'skipped';
    durationMs: number;
    error?: string;
  }>;
  error?: string;
}

export interface IRuleTemplate {
  _id: string;
  templateId: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  category: string;
  trigger: IAutomationRule['trigger'];
  conditions: IAutomationRule['conditions'];
  actions: IAutomationRule['actions'];
  scope: IAutomationRule['scope'];
  execution: IAutomationRule['execution'];
  tags: string[];
  popularity: number;
}

export interface IAutomationStats {
  totalRules: number;
  activeRules: number;
  inactiveRules: number;
  draftRules: number;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTimeMs: number;
}

// ============================================
// Constants
// ============================================

const BASE = '/api/v2/itsm/automation';
const RULES_KEY = 'automation-rules';
const TEMPLATES_KEY = 'automation-templates';
const STATS_KEY = 'automation-stats';
const LOGS_KEY = 'automation-logs';

// ============================================
// Hooks — Rules CRUD
// ============================================

export const useAutomationRules = (filters?: {
  status?: AutomationRuleStatus;
  triggerType?: RuleTriggerType;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.triggerType) params.append('triggerType', filters.triggerType);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.page) params.append('page', String(filters.page));
  if (filters?.limit) params.append('limit', String(filters.limit));

  return useQuery({
    queryKey: [RULES_KEY, 'list', filters],
    queryFn: async () => {
      const response = await api.get<{
        success: boolean;
        data: { rules: IAutomationRule[] };
        pagination: { page: number; limit: number; total: number; totalPages: number };
      }>(`${BASE}/rules?${params.toString()}`);
      return response;
    },
  });
};

export const useAutomationRule = (id: string) => {
  return useQuery({
    queryKey: [RULES_KEY, id],
    queryFn: async () => {
      const response = await api.get<{
        success: boolean;
        data: { rule: IAutomationRule };
      }>(`${BASE}/rules/${id}`);
      return response.data.rule;
    },
    enabled: !!id,
  });
};

export const useCreateAutomationRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<IAutomationRule>) => {
      return api.post<{ success: boolean; data: { rule: IAutomationRule } }>(
        `${BASE}/rules`,
        data
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RULES_KEY] });
      queryClient.invalidateQueries({ queryKey: [STATS_KEY] });
    },
  });
};

export const useUpdateAutomationRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<IAutomationRule> }) => {
      return api.put<{ success: boolean; data: { rule: IAutomationRule } }>(
        `${BASE}/rules/${id}`,
        data
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RULES_KEY] });
    },
  });
};

export const useDeleteAutomationRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return api.delete<{ success: boolean }>(`${BASE}/rules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RULES_KEY] });
      queryClient.invalidateQueries({ queryKey: [STATS_KEY] });
    },
  });
};

export const useActivateRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return api.post<{ success: boolean; data: { rule: IAutomationRule } }>(
        `${BASE}/rules/${id}/activate`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RULES_KEY] });
      queryClient.invalidateQueries({ queryKey: [STATS_KEY] });
    },
  });
};

export const useDeactivateRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return api.post<{ success: boolean; data: { rule: IAutomationRule } }>(
        `${BASE}/rules/${id}/deactivate`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RULES_KEY] });
      queryClient.invalidateQueries({ queryKey: [STATS_KEY] });
    },
  });
};

export const useCreateRuleFromTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (templateId: string) => {
      return api.post<{ success: boolean; data: { rule: IAutomationRule } }>(
        `${BASE}/rules/from-template/${templateId}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RULES_KEY] });
    },
  });
};

// ============================================
// Hooks — Execution Logs
// ============================================

export const useRuleLogs = (ruleId: string, filters?: {
  status?: string;
  page?: number;
  limit?: number;
}) => {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.page) params.append('page', String(filters.page));
  if (filters?.limit) params.append('limit', String(filters.limit));

  return useQuery({
    queryKey: [LOGS_KEY, ruleId, filters],
    queryFn: async () => {
      const response = await api.get<{
        success: boolean;
        data: { logs: IRuleExecutionLog[] };
        pagination: { page: number; limit: number; total: number; totalPages: number };
      }>(`${BASE}/rules/${ruleId}/logs?${params.toString()}`);
      return response;
    },
    enabled: !!ruleId,
  });
};

// ============================================
// Hooks — Templates
// ============================================

export const useAutomationTemplates = () => {
  return useQuery({
    queryKey: [TEMPLATES_KEY],
    queryFn: async () => {
      const response = await api.get<{
        success: boolean;
        data: { templates: IRuleTemplate[] };
      }>(`${BASE}/templates`);
      return response.data.templates;
    },
  });
};

// ============================================
// Hooks — Stats
// ============================================

export const useAutomationStats = () => {
  return useQuery({
    queryKey: [STATS_KEY],
    queryFn: async () => {
      const response = await api.get<{
        success: boolean;
        data: IAutomationStats;
      }>(`${BASE}/stats`);
      return response.data;
    },
  });
};
