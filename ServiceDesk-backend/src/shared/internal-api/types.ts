/**
 * Internal API Types
 *
 * Defines the contracts for inter-module communication.
 * Modules expose facades implementing these interfaces.
 * Other modules consume them via DI — never importing internals directly.
 */

// ── Pagination ──────────────────────────────────────────────

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Generic Internal API ────────────────────────────────────

export interface IInternalApi {
  /** Module name this API belongs to */
  readonly moduleName: string;
}

// ── ITSM Internal API ───────────────────────────────────────

export interface IItsmApi extends IInternalApi {
  getServiceRequest(id: string): Promise<any | null>;
  listServiceRequests(filters?: Record<string, any>, pagination?: PaginationOptions): Promise<PaginatedResult<any>>;
  getConfigItem(id: string): Promise<any | null>;
  listConfigItems(filters?: Record<string, any>, pagination?: PaginationOptions): Promise<PaginatedResult<any>>;
  getCatalogItem(id: string): Promise<any | null>;
  listCatalogItems(filters?: Record<string, any>): Promise<any[]>;
  getAutomationRule(id: string): Promise<any | null>;
}

// ── PM Internal API ─────────────────────────────────────────

export interface IPmApi extends IInternalApi {
  getProject(id: string): Promise<any | null>;
  listProjects(orgId: string, pagination?: PaginationOptions): Promise<PaginatedResult<any>>;
  getTask(id: string): Promise<any | null>;
  listTasks(filters?: Record<string, any>, pagination?: PaginationOptions): Promise<PaginatedResult<any>>;
  getSprint(id: string): Promise<any | null>;
  getBoard(id: string): Promise<any | null>;
  /** Mongoose model for aggregation queries (analytics) */
  getTaskModel(): any;
  /** PM enums (PMStatusCategory, PMTaskType, PMTaskPriority) */
  getTaskEnums(): { PMStatusCategory: any; PMTaskType: any; PMTaskPriority: any };
}

// ── Workflow Engine Internal API ────────────────────────────

export interface IWorkflowApi extends IInternalApi {
  startWorkflow(definitionId: string, variables: Record<string, any>, userId: string): Promise<any>;
  executeTransition(instanceId: string, transitionCode: string, userId: string, data?: Record<string, any>): Promise<any>;
  getAvailableTransitions(instanceId: string, userId: string): Promise<any[]>;
  cancelWorkflow(instanceId: string, userId: string, reason?: string): Promise<any>;
  suspendWorkflow(instanceId: string, userId: string): Promise<any>;
  resumeWorkflow(instanceId: string, userId: string): Promise<any>;
  getWorkflowInstance(instanceId: string): Promise<any | null>;
  getWorkflowDefinition(definitionId: string): Promise<any | null>;
}

// ── Analytics Internal API ──────────────────────────────────

export interface IAnalyticsApi extends IInternalApi {
  getDashboardKPIs(period: string): Promise<any>;
  getPerformanceMetrics(userId: string, period: string): Promise<any>;
}

// ── SLA Internal API ──────────────────────────────────────────

export interface ISlaApi extends IInternalApi {
  getTicketSla(tenantId: string, ticketId: string): Promise<any | null>;
  onTicketCreated(tenantId: string, ticketId: string, ticketType: string, attributes: Record<string, any>): Promise<any>;
  onTicketStatusChanged(tenantId: string, ticketId: string, newStatus: string): Promise<void>;
  onTicketResolved(tenantId: string, ticketId: string): Promise<void>;
  onTicketCancelled(tenantId: string, ticketId: string): Promise<void>;
}

// ── Gamification Internal API ────────────────────────────────

export interface IGamificationApi extends IInternalApi {
  getProfile(userId: string, organizationId: string): Promise<any | null>;
  getLeaderboard(organizationId: string, scope?: string, period?: string): Promise<any[]>;
}

// ── Notifications Internal API ──────────────────────────────

export interface INotificationsApi extends IInternalApi {
  send(userId: string, notification: { title: string; titleAr?: string; body: string; bodyAr?: string; type: string; link?: string }): Promise<void>;
  sendBulk(userIds: string[], notification: { title: string; titleAr?: string; body: string; bodyAr?: string; type: string; link?: string }): Promise<void>;
}

// ── Campaigns Internal API ──────────────────────────────────

export interface ICampaignsApi extends IInternalApi {
  sendCampaignMessage(campaignId: string, recipientId: string, channel: string): Promise<any>;
  getSegmentRecipients(segmentId: string, organizationId: string): Promise<string[]>;
  getUserPreference(userId: string, organizationId: string): Promise<any | null>;
}
