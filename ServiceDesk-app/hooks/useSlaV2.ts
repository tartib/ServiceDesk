import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

// ── Types ────────────────────────────────────────────────────

export interface ISlaPolicy {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  entityType: string;
  priority: number;
  matchConditions: Array<{ field: string; operator: string; value: string | number | boolean | string[] }>;
  isActive: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  goals?: ISlaGoal[];
}

export interface ISlaGoal {
  id: string;
  policyId: string;
  metricKey: string;
  targetMinutes: number;
  calendarId?: string;
  startEvent: string;
  stopEvent: string;
  pauseOnStatuses: string[];
  resumeOnStatuses: string[];
  breachSeverity: string;
  createdAt: string;
}

export interface ISlaEscalationRule {
  id: string;
  goalId: string;
  triggerType: string;
  offsetMinutes: number;
  actionType: string;
  actionConfig: Record<string, unknown>;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface ISlaCalendar {
  id: string;
  tenantId: string;
  name: string;
  nameAr?: string;
  timezone: string;
  isDefault: boolean;
  isActive: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  workingHours?: ISlaWorkingHours[];
  holidays?: ISlaHoliday[];
}

export interface ISlaWorkingHours {
  id: string;
  calendarId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isWorkingDay: boolean;
}

export interface ISlaHoliday {
  id: string;
  calendarId: string;
  holidayDate: string;
  name?: string;
  nameAr?: string;
}

export interface ITicketSlaView {
  ticketId: string;
  ticketType: string;
  policy: { id: string; code: string; name: string; nameAr?: string };
  instanceId: string;
  instanceStatus: string;
  metrics: ITicketSlaMetric[];
}

export interface ITicketSlaMetric {
  metricKey: string;
  status: string;
  targetMinutes: number;
  startedAt?: string;
  stoppedAt?: string;
  dueAt?: string;
  breachedAt?: string;
  elapsedBusinessSeconds: number;
  remainingBusinessSeconds: number;
  breached: boolean;
  paused: boolean;
}

export interface ISlaStats {
  policies: { total: number; active: number };
  calendars: { total: number };
  instances: Record<string, number>;
}

export interface ISlaComplianceReport {
  period: string;
  total: number;
  met: number;
  breached: number;
  compliancePercent: number;
  avgResponseMinutes: number;
  avgResolutionMinutes: number;
}

// ── Base path ────────────────────────────────────────────────

const BASE = '/api/v2/sla';
const POLICY_KEY = 'sla-policies';
const CALENDAR_KEY = 'sla-calendars';
const SLA_TICKET_KEY = 'sla-ticket';
const SLA_STATS_KEY = 'sla-stats';
const SLA_COMPLIANCE_KEY = 'sla-compliance';

// ── Policies ─────────────────────────────────────────────────

export const useSlaPolicies = (filters?: {
  entityType?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const params = new URLSearchParams();
  if (filters?.entityType) params.append('entityType', filters.entityType);
  if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));
  if (filters?.search) params.append('search', filters.search);
  if (filters?.page) params.append('page', String(filters.page));
  if (filters?.limit) params.append('limit', String(filters.limit));

  return useQuery({
    queryKey: [POLICY_KEY, 'list', filters],
    queryFn: async () => {
      const res = await api.get<{
        success: boolean;
        data: ISlaPolicy[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      }>(`${BASE}/policies?${params.toString()}`);
      return res.data;
    },
  });
};

export const useSlaPolicy = (id: string) => {
  return useQuery({
    queryKey: [POLICY_KEY, id],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: ISlaPolicy }>(`${BASE}/policies/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
};

export const useCreateSlaPolicy = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ISlaPolicy> & { goals?: Partial<ISlaGoal>[] }) =>
      api.post<{ success: boolean; data: ISlaPolicy }>(`${BASE}/policies`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [POLICY_KEY] }),
  });
};

export const useUpdateSlaPolicy = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ISlaPolicy> }) =>
      api.patch<{ success: boolean; data: ISlaPolicy }>(`${BASE}/policies/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [POLICY_KEY] }),
  });
};

export const useDeleteSlaPolicy = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`${BASE}/policies/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: [POLICY_KEY] }),
  });
};

export const useActivateSlaPolicy = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`${BASE}/policies/${id}/activate`),
    onSuccess: () => qc.invalidateQueries({ queryKey: [POLICY_KEY] }),
  });
};

export const useDeactivateSlaPolicy = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`${BASE}/policies/${id}/deactivate`),
    onSuccess: () => qc.invalidateQueries({ queryKey: [POLICY_KEY] }),
  });
};

// ── Calendars ────────────────────────────────────────────────

export const useSlaCalendars = () => {
  return useQuery({
    queryKey: [CALENDAR_KEY, 'list'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: ISlaCalendar[] }>(`${BASE}/calendars`);
      return res.data;
    },
  });
};

export const useSlaCalendar = (id: string) => {
  return useQuery({
    queryKey: [CALENDAR_KEY, id],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: ISlaCalendar }>(`${BASE}/calendars/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
};

export const useCreateSlaCalendar = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ISlaCalendar> & { workingHours?: Partial<ISlaWorkingHours>[]; holidays?: Partial<ISlaHoliday>[] }) =>
      api.post<{ success: boolean; data: ISlaCalendar }>(`${BASE}/calendars`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [CALENDAR_KEY] }),
  });
};

export const useUpdateSlaCalendar = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ISlaCalendar> }) =>
      api.patch<{ success: boolean; data: ISlaCalendar }>(`${BASE}/calendars/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [CALENDAR_KEY] }),
  });
};

export const useDeleteSlaCalendar = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`${BASE}/calendars/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: [CALENDAR_KEY] }),
  });
};

// ── Ticket SLA View ──────────────────────────────────────────

export const useTicketSla = (ticketId: string) => {
  return useQuery({
    queryKey: [SLA_TICKET_KEY, ticketId],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: ITicketSlaView }>(`${BASE}/tickets/${ticketId}`);
      return res.data;
    },
    enabled: !!ticketId,
    refetchInterval: 30_000, // Live countdown refresh
  });
};

// ── Reports ──────────────────────────────────────────────────

export const useSlaStats = () => {
  return useQuery({
    queryKey: [SLA_STATS_KEY],
    queryFn: async (): Promise<ISlaStats> => {
      const res = await api.get<{ success: boolean; data: ISlaStats }>(`${BASE}/reports/stats`);
      return res.data;
    },
  });
};

export const useSlaComplianceReport = (from?: string, to?: string) => {
  const params = new URLSearchParams();
  if (from) params.append('from', from);
  if (to) params.append('to', to);

  return useQuery({
    queryKey: [SLA_COMPLIANCE_KEY, from, to],
    queryFn: async (): Promise<ISlaComplianceReport> => {
      const res = await api.get<{ success: boolean; data: ISlaComplianceReport }>(`${BASE}/reports/compliance?${params.toString()}`);
      return res.data;
    },
  });
};
