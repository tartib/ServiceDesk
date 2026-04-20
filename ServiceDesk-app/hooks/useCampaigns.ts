import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

// ── Base path ────────────────────────────────────────────────

const BASE = '/campaigns';

// ── Query Keys ───────────────────────────────────────────────

const KEYS = {
  campaigns: 'campaigns',
  campaign: 'campaign',
  campaignMessages: 'campaign-messages',
  templates: 'campaign-templates',
  template: 'campaign-template',
  segments: 'campaign-segments',
  segment: 'campaign-segment',
  triggers: 'campaign-triggers',
  trigger: 'campaign-trigger',
  journeys: 'campaign-journeys',
  journey: 'campaign-journey',
  journeyInstances: 'campaign-journey-instances',
  preferences: 'campaign-preferences',
  providers: 'campaign-providers',
  provider: 'campaign-provider',
  abTests: 'campaign-ab-tests',
  abTest: 'campaign-ab-test',
  analyticsOverview: 'campaign-analytics-overview',
  analyticsChannels: 'campaign-analytics-channels',
  analyticsCampaign: 'campaign-analytics-detail',
  auditLog: 'campaign-audit-log',
  auditEntity: 'campaign-audit-entity',
} as const;

// ── Types ────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}

export interface ICampaign {
  _id: string;
  name: string;
  nameAr?: string;
  description?: string;
  channel: string;
  mode: string;
  status: string;
  templateId?: string;
  segmentId?: string;
  subject?: string;
  body?: string;
  bodyHtml?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  sendAt?: string;
  sentAt?: string;
  completedAt?: string;
  recipientCount?: number;
  stats: {
    queued: number;
    sent: number;
    delivered: number;
    failed: number;
    opened: number;
    clicked: number;
    unsubscribed: number;
    openRate: number;
    clickRate: number;
  };
  tags: string[];
  createdBy: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface INotificationTemplate {
  _id: string;
  name: string;
  nameAr?: string;
  channel: string;
  subject?: string;
  body: string;
  bodyHtml?: string;
  variables: { key: string; description?: string; defaultValue?: string }[];
  ctaLabel?: string;
  ctaUrl?: string;
  isActive: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ISegment {
  _id: string;
  name: string;
  nameAr?: string;
  description?: string;
  rules: { field: string; operator: string; value: unknown; logicGroup: string }[];
  estimatedCount?: number;
  lastEvaluatedAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ITriggerDefinition {
  _id: string;
  name: string;
  event: string;
  conditions: { field: string; operator: string; value: unknown }[];
  cooldownMinutes: number;
  linkedCampaignId?: string;
  linkedJourneyId?: string;
  isEnabled: boolean;
  fireCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface IJourney {
  _id: string;
  name: string;
  nameAr?: string;
  description?: string;
  status: string;
  triggerDefinitionId?: string;
  steps: {
    stepId: string;
    stepOrder: number;
    type: string;
    name?: string;
    channel?: string;
    templateId?: string;
    delayMinutes?: number;
    nextStepId?: string;
  }[];
  activeUserCount: number;
  completedUserCount: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IJourneyInstance {
  _id: string;
  journeyId: string;
  userId: string;
  currentStepId: string;
  status: string;
  waitUntil?: string;
  enteredAt: string;
  completedAt?: string;
}

export interface IMessage {
  _id: string;
  campaignId?: string;
  recipientId: string;
  recipientEmail?: string;
  channel: string;
  status: string;
  sentAt?: string;
  deliveredAt?: string;
  openedAt?: string;
  clickedAt?: string;
  failureReason?: string;
  createdAt: string;
}

export interface IUserPreference {
  _id: string;
  userId: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  marketingEnabled: boolean;
  transactionalEnabled: boolean;
  remindersEnabled: boolean;
  productUpdatesEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursFrom?: string;
  quietHoursTo?: string;
}

export interface IProviderConfig {
  _id: string;
  name: string;
  type: string;
  provider: string;
  credentials: Record<string, string>;
  isDefault: boolean;
  priority: number;
  isActive: boolean;
  lastTestedAt?: string;
  lastTestSuccess?: boolean;
  createdAt: string;
}

export interface IABTest {
  _id: string;
  campaignId: string;
  status: string;
  metric: string;
  variants: {
    variantId: string;
    name: string;
    splitPercentage: number;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
  }[];
  winnerVariantId?: string;
  autoDecideAfterHours?: number;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface IAuditEntry {
  _id: string;
  entityType: string;
  entityId: string;
  entityName?: string;
  action: string;
  performedBy: string;
  performedByName?: string;
  changes?: Record<string, { from: unknown; to: unknown }>;
  timestamp: string;
}

export interface IAnalyticsOverview {
  totalCampaigns: number;
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  totalOpened: number;
  totalClicked: number;
  avgOpenRate: number;
  avgClickRate: number;
  avgDeliveryRate: number;
  byChannel: { channel: string; totalSent: number; totalDelivered: number; openRate: number; clickRate: number }[];
}

export interface ICampaignAnalytics {
  campaignId: string;
  campaignName: string;
  channel: string;
  recipientCount: number;
  sent: number;
  delivered: number;
  failed: number;
  opened: number;
  clicked: number;
  openRate: number;
  clickRate: number;
  deliveryRate: number;
  failureRate: number;
}

// ── Campaign Hooks ───────────────────────────────────────────

export function useCampaigns(params?: { page?: number; limit?: number; status?: string; channel?: string; mode?: string; search?: string }) {
  return useQuery({
    queryKey: [KEYS.campaigns, params],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: PaginatedResponse<ICampaign> }>(`${BASE}`, { params });
      return res.data;
    },
  });
}

export function useCampaign(id?: string) {
  return useQuery({
    queryKey: [KEYS.campaign, id],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: ICampaign }>(`${BASE}/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<ICampaign>) => {
      const res = await api.post<{ success: boolean; data: ICampaign }>(`${BASE}`, data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEYS.campaigns] }),
  });
}

export function useUpdateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ICampaign> }) => {
      const res = await api.patch<{ success: boolean; data: ICampaign }>(`${BASE}/${id}`, data);
      return res.data;
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: [KEYS.campaigns] });
      qc.invalidateQueries({ queryKey: [KEYS.campaign, id] });
    },
  });
}

export function useDeleteCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete<{ success: boolean }>(`${BASE}/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEYS.campaigns] }),
  });
}

export function useScheduleCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, sendAt }: { id: string; sendAt?: string }) => {
      const res = await api.post<{ success: boolean; data: ICampaign }>(`${BASE}/${id}/schedule`, { sendAt });
      return res.data;
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: [KEYS.campaigns] });
      qc.invalidateQueries({ queryKey: [KEYS.campaign, id] });
    },
  });
}

export function useSendCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post<{ success: boolean; data: ICampaign }>(`${BASE}/${id}/send`);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEYS.campaigns] }),
  });
}

export function usePauseCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post<{ success: boolean; data: ICampaign }>(`${BASE}/${id}/pause`);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEYS.campaigns] }),
  });
}

export function useResumeCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post<{ success: boolean; data: ICampaign }>(`${BASE}/${id}/resume`);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEYS.campaigns] }),
  });
}

export function useCancelCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post<{ success: boolean; data: ICampaign }>(`${BASE}/${id}/cancel`);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEYS.campaigns] }),
  });
}

export function useTestCampaign() {
  return useMutation({
    mutationFn: async ({ id, recipientEmail }: { id: string; recipientEmail: string }) => {
      const res = await api.post<{ success: boolean; data: { sent: boolean } }>(`${BASE}/${id}/test`, { recipientEmail });
      return res.data;
    },
  });
}

export function useCampaignMessages(campaignId?: string, params?: { page?: number; limit?: number; status?: string }) {
  return useQuery({
    queryKey: [KEYS.campaignMessages, campaignId, params],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: PaginatedResponse<IMessage> }>(`${BASE}/${campaignId}/messages`, { params });
      return res.data;
    },
    enabled: !!campaignId,
  });
}

// ── Template Hooks ───────────────────────────────────────────

export function useTemplates(params?: { page?: number; limit?: number; channel?: string; search?: string }) {
  return useQuery({
    queryKey: [KEYS.templates, params],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: PaginatedResponse<INotificationTemplate> }>(`${BASE}/templates`, { params });
      return res.data;
    },
  });
}

export function useTemplate(id?: string) {
  return useQuery({
    queryKey: [KEYS.template, id],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: INotificationTemplate }>(`${BASE}/templates/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<INotificationTemplate>) => {
      const res = await api.post<{ success: boolean; data: INotificationTemplate }>(`${BASE}/templates`, data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEYS.templates] }),
  });
}

export function useUpdateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<INotificationTemplate> }) => {
      const res = await api.patch<{ success: boolean; data: INotificationTemplate }>(`${BASE}/templates/${id}`, data);
      return res.data;
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: [KEYS.templates] });
      qc.invalidateQueries({ queryKey: [KEYS.template, id] });
    },
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete<{ success: boolean }>(`${BASE}/templates/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEYS.templates] }),
  });
}

export function usePreviewTemplate() {
  return useMutation({
    mutationFn: async ({ id, sampleData }: { id: string; sampleData?: Record<string, unknown> }) => {
      const res = await api.post<{ success: boolean; data: { subject?: string; body: string; bodyHtml?: string } }>(`${BASE}/templates/${id}/preview`, { sampleData });
      return res.data;
    },
  });
}

// ── Segment Hooks ────────────────────────────────────────────

export function useSegments(params?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: [KEYS.segments, params],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: PaginatedResponse<ISegment> }>(`${BASE}/segments`, { params });
      return res.data;
    },
  });
}

export function useSegment(id?: string) {
  return useQuery({
    queryKey: [KEYS.segment, id],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: ISegment }>(`${BASE}/segments/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateSegment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<ISegment>) => {
      const res = await api.post<{ success: boolean; data: ISegment }>(`${BASE}/segments`, data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEYS.segments] }),
  });
}

export function useUpdateSegment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ISegment> }) => {
      const res = await api.patch<{ success: boolean; data: ISegment }>(`${BASE}/segments/${id}`, data);
      return res.data;
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: [KEYS.segments] });
      qc.invalidateQueries({ queryKey: [KEYS.segment, id] });
    },
  });
}

export function useDeleteSegment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete<{ success: boolean }>(`${BASE}/segments/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEYS.segments] }),
  });
}

export function usePreviewSegment(id?: string) {
  return useQuery({
    queryKey: [KEYS.segment, id, 'preview'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: { estimatedCount: number } }>(`${BASE}/segments/${id}/preview`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function usePreviewSegmentRules() {
  return useMutation({
    mutationFn: async (rules: unknown[]) => {
      const res = await api.post<{ success: boolean; data: { estimatedCount: number } }>(`${BASE}/segments/preview-rules`, { rules });
      return res.data;
    },
  });
}

// ── Trigger Hooks ────────────────────────────────────────────

export function useTriggers(params?: { page?: number; limit?: number; event?: string }) {
  return useQuery({
    queryKey: [KEYS.triggers, params],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: PaginatedResponse<ITriggerDefinition> }>(`${BASE}/triggers`, { params });
      return res.data;
    },
  });
}

export function useTrigger(id?: string) {
  return useQuery({
    queryKey: [KEYS.trigger, id],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: ITriggerDefinition }>(`${BASE}/triggers/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateTrigger() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<ITriggerDefinition>) => {
      const res = await api.post<{ success: boolean; data: ITriggerDefinition }>(`${BASE}/triggers`, data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEYS.triggers] }),
  });
}

export function useUpdateTrigger() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ITriggerDefinition> }) => {
      const res = await api.patch<{ success: boolean; data: ITriggerDefinition }>(`${BASE}/triggers/${id}`, data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEYS.triggers] }),
  });
}

export function useDeleteTrigger() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete<{ success: boolean }>(`${BASE}/triggers/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEYS.triggers] }),
  });
}

export function useToggleTrigger() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post<{ success: boolean; data: ITriggerDefinition }>(`${BASE}/triggers/${id}/toggle`);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEYS.triggers] }),
  });
}

// ── Journey Hooks ────────────────────────────────────────────

export function useJourneys(params?: { page?: number; limit?: number; status?: string; search?: string }) {
  return useQuery({
    queryKey: [KEYS.journeys, params],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: PaginatedResponse<IJourney> }>(`${BASE}/journeys`, { params });
      return res.data;
    },
  });
}

export function useJourney(id?: string) {
  return useQuery({
    queryKey: [KEYS.journey, id],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: IJourney }>(`${BASE}/journeys/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateJourney() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<IJourney>) => {
      const res = await api.post<{ success: boolean; data: IJourney }>(`${BASE}/journeys`, data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEYS.journeys] }),
  });
}

export function useUpdateJourney() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<IJourney> }) => {
      const res = await api.patch<{ success: boolean; data: IJourney }>(`${BASE}/journeys/${id}`, data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEYS.journeys] }),
  });
}

export function useDeleteJourney() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete<{ success: boolean }>(`${BASE}/journeys/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEYS.journeys] }),
  });
}

export function usePublishJourney() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post<{ success: boolean; data: IJourney }>(`${BASE}/journeys/${id}/publish`);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEYS.journeys] }),
  });
}

export function usePauseJourney() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post<{ success: boolean; data: IJourney }>(`${BASE}/journeys/${id}/pause`);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEYS.journeys] }),
  });
}

export function useArchiveJourney() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post<{ success: boolean; data: IJourney }>(`${BASE}/journeys/${id}/archive`);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEYS.journeys] }),
  });
}

export function useJourneyInstances(journeyId?: string, params?: { page?: number; status?: string }) {
  return useQuery({
    queryKey: [KEYS.journeyInstances, journeyId, params],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: PaginatedResponse<IJourneyInstance> }>(`${BASE}/journeys/${journeyId}/instances`, { params });
      return res.data;
    },
    enabled: !!journeyId,
  });
}

// ── Preferences Hooks ────────────────────────────────────────

export function useMyPreferences() {
  return useQuery({
    queryKey: [KEYS.preferences],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: IUserPreference }>(`${BASE}/preferences/me`);
      return res.data;
    },
  });
}

export function useUpdateMyPreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<IUserPreference>) => {
      const res = await api.patch<{ success: boolean; data: IUserPreference }>(`${BASE}/preferences/me`, data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEYS.preferences] }),
  });
}

// ── Provider Hooks ───────────────────────────────────────────

export function useProviders(params?: { type?: string }) {
  return useQuery({
    queryKey: [KEYS.providers, params],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: IProviderConfig[] }>(`${BASE}/providers`, { params });
      return res.data;
    },
  });
}

export function useProvider(id?: string) {
  return useQuery({
    queryKey: [KEYS.provider, id],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: IProviderConfig }>(`${BASE}/providers/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<IProviderConfig>) => {
      const res = await api.post<{ success: boolean; data: IProviderConfig }>(`${BASE}/providers`, data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEYS.providers] }),
  });
}

export function useUpdateProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<IProviderConfig> }) => {
      const res = await api.patch<{ success: boolean; data: IProviderConfig }>(`${BASE}/providers/${id}`, data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEYS.providers] }),
  });
}

export function useDeleteProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete<{ success: boolean }>(`${BASE}/providers/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEYS.providers] }),
  });
}

export function useTestProvider() {
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post<{ success: boolean; data: { tested: boolean; success: boolean } }>(`${BASE}/providers/${id}/test`);
      return res.data;
    },
  });
}

export function useSetDefaultProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post<{ success: boolean; data: IProviderConfig }>(`${BASE}/providers/${id}/set-default`);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEYS.providers] }),
  });
}

// ── A/B Test Hooks ───────────────────────────────────────────

export function useABTests(params?: { page?: number; limit?: number; status?: string; campaignId?: string }) {
  return useQuery({
    queryKey: [KEYS.abTests, params],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: PaginatedResponse<IABTest> }>(`${BASE}/ab-tests`, { params });
      return res.data;
    },
  });
}

export function useABTest(id?: string) {
  return useQuery({
    queryKey: [KEYS.abTest, id],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: IABTest }>(`${BASE}/ab-tests/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateABTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<IABTest>) => {
      const res = await api.post<{ success: boolean; data: IABTest }>(`${BASE}/ab-tests`, data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEYS.abTests] }),
  });
}

export function useUpdateABTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<IABTest> }) => {
      const res = await api.patch<{ success: boolean; data: IABTest }>(`${BASE}/ab-tests/${id}`, data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEYS.abTests] }),
  });
}

export function useStartABTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post<{ success: boolean; data: IABTest }>(`${BASE}/ab-tests/${id}/start`);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEYS.abTests] }),
  });
}

export function useCompleteABTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, winnerVariantId }: { id: string; winnerVariantId: string }) => {
      const res = await api.post<{ success: boolean; data: IABTest }>(`${BASE}/ab-tests/${id}/complete`, { winnerVariantId });
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEYS.abTests] }),
  });
}

// ── Analytics Hooks ──────────────────────────────────────────

export function useAnalyticsOverview() {
  return useQuery({
    queryKey: [KEYS.analyticsOverview],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: IAnalyticsOverview }>(`${BASE}/analytics/overview`);
      return res.data;
    },
  });
}

export function useAnalyticsChannels() {
  return useQuery({
    queryKey: [KEYS.analyticsChannels],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: { channel: string; totalSent: number; totalDelivered: number; openRate: number; clickRate: number }[] }>(`${BASE}/analytics/channels`);
      return res.data;
    },
  });
}

export function useAnalyticsCampaign(campaignId?: string) {
  return useQuery({
    queryKey: [KEYS.analyticsCampaign, campaignId],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: ICampaignAnalytics }>(`${BASE}/analytics/campaigns/${campaignId}`);
      return res.data;
    },
    enabled: !!campaignId,
  });
}

export function useRefreshCampaignStats() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (campaignId: string) => {
      await api.post<{ success: boolean }>(`${BASE}/analytics/campaigns/${campaignId}/refresh`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEYS.analyticsOverview] });
      qc.invalidateQueries({ queryKey: [KEYS.analyticsCampaign] });
    },
  });
}

// ── Audit Hooks ──────────────────────────────────────────────

export function useAuditLog(params?: { page?: number; limit?: number; entityType?: string; action?: string }) {
  return useQuery({
    queryKey: [KEYS.auditLog, params],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: PaginatedResponse<IAuditEntry> }>(`${BASE}/audit`, { params });
      return res.data;
    },
  });
}

export function useEntityAuditTrail(entityId?: string) {
  return useQuery({
    queryKey: [KEYS.auditEntity, entityId],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: IAuditEntry[] }>(`${BASE}/audit/entity/${entityId}`);
      return res.data;
    },
    enabled: !!entityId,
  });
}
