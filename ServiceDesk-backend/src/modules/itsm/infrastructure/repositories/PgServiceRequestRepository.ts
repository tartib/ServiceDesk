/**
 * PostgreSQL Service Request Repository
 *
 * Used when DB_STRATEGY_ITSM = 'postgresql'.
 * Maps to itsm_service_requests table.
 */

import { PostgresRepository } from '../../../../shared/database/PostgresRepository';
import { getPool } from '../../../../shared/database/PostgresConnectionManager';

export class PgServiceRequestRepository extends PostgresRepository<any> {
  constructor() {
    super({
      tableName: 'itsm_service_requests',
      columnMap: {
        'requestId': 'request_id',
        'serviceId': 'service_id',
        'serviceName': 'service_name',
        'serviceNameAr': 'service_name_ar',
        'serviceCategory': 'service_category',
        'requester.userId': 'requester_user_id',
        'requester.name': 'requester_name',
        'requester.email': 'requester_email',
        'requester.department': 'requester_department',
        'requester.phone': 'requester_phone',
        'onBehalfOf.userId': 'on_behalf_of_user_id',
        'onBehalfOf.name': 'on_behalf_of_name',
        'onBehalfOf.email': 'on_behalf_of_email',
        'onBehalfOf.department': 'on_behalf_of_department',
        'formData': 'form_data',
        'formDataDisplay': 'form_data_display',
        'workflowInstanceId': 'workflow_instance_id',
        'currentState': 'current_state',
        'stateHistory': 'state_history',
        'assignedTo.userId': 'assigned_to_user_id',
        'assignedTo.name': 'assigned_to_name',
        'assignedTo.assignedAt': 'assigned_to_at',
        'assignedTo.assignedBy': 'assigned_to_by',
        'assignedTeam': 'assigned_team',
        'approvalStage': 'approval_stage',
        'fulfillmentTasks': 'fulfillment_tasks',
        'fulfillmentStartedAt': 'fulfillment_started_at',
        'fulfillmentCompletedAt': 'fulfillment_completed_at',
        'sla.priority': 'sla_priority',
        'sla.targetResponseTime': 'sla_target_response_time',
        'sla.targetResolutionTime': 'sla_target_resolution_time',
        'sla.targetResponseDate': 'sla_target_response_date',
        'sla.targetResolutionDate': 'sla_target_resolution_date',
        'sla.actualResponseTime': 'sla_actual_response_time',
        'sla.actualResolutionTime': 'sla_actual_resolution_time',
        'sla.responseBreached': 'sla_response_breached',
        'sla.resolutionBreached': 'sla_resolution_breached',
        'sla.breachReason': 'sla_breach_reason',
        'sla.pausedDuration': 'sla_paused_duration',
        'sla.onHoldSince': 'sla_on_hold_since',
        'relatedIncidents': 'related_incidents',
        'relatedChanges': 'related_changes',
        'relatedProblems': 'related_problems',
        'relatedAssets': 'related_assets',
        'linkedKnowledgeArticles': 'linked_knowledge_articles',
        'notificationsSent': 'notifications_sent',
        'satisfaction.rating': 'satisfaction_rating',
        'satisfaction.comment': 'satisfaction_comment',
        'satisfaction.submittedAt': 'satisfaction_submitted_at',
        'satisfaction.submittedBy': 'satisfaction_submitted_by',
        'statusReason': 'status_reason',
        'submittedAt': 'submitted_at',
        'completedAt': 'completed_at',
        'cancelledAt': 'cancelled_at',
        'cancelledBy': 'cancelled_by',
        'cancellationReason': 'cancellation_reason',
        'ipAddress': 'ip_address',
        'userAgent': 'user_agent',
        'organizationId': 'organization_id',
        'mongoId': 'mongo_id',
      },
    });
  }

  async findByRequestId(requestId: string) {
    return this.findOne({ requestId });
  }

  async findByRequester(userId: string) {
    return this.findAll({ 'requester.userId': userId });
  }

  async findByStatus(status: string) {
    return this.findAll({ status });
  }

  async cancel(id: string, userId: string, reason?: string) {
    return this.updateById(id, {
      status: 'cancelled',
      cancelledAt: new Date(),
      cancelledBy: userId,
      cancellationReason: reason,
    } as any);
  }

  /**
   * Create a service request with flattened nested objects.
   * Transforms the Mongoose-shaped input into the flat PG column layout.
   */
  async createRequest(data: any) {
    const flat: Record<string, any> = {
      serviceId: data.serviceId,
      serviceName: data.serviceName,
      serviceNameAr: data.serviceNameAr,
      serviceCategory: data.serviceCategory,
      // requester flattened
      'requester.userId': data.requester?.userId,
      'requester.name': data.requester?.name,
      'requester.email': data.requester?.email,
      'requester.department': data.requester?.department,
      'requester.phone': data.requester?.phone,
      // on behalf of
      'onBehalfOf.userId': data.onBehalfOf?.userId,
      'onBehalfOf.name': data.onBehalfOf?.name,
      'onBehalfOf.email': data.onBehalfOf?.email,
      'onBehalfOf.department': data.onBehalfOf?.department,
      // form data (JSONB)
      formData: JSON.stringify(data.formData || {}),
      formDataDisplay: JSON.stringify(data.formDataDisplay || []),
      currentState: data.currentState,
      stateHistory: JSON.stringify(data.stateHistory || []),
      approvalStage: data.approvalStage,
      approvals: JSON.stringify(data.approvals || []),
      fulfillmentTasks: JSON.stringify(data.fulfillmentTasks || []),
      // SLA flattened
      'sla.priority': data.sla?.priority,
      'sla.targetResponseTime': data.sla?.targetResponseTime,
      'sla.targetResolutionTime': data.sla?.targetResolutionTime,
      'sla.targetResponseDate': data.sla?.targetResponseDate,
      'sla.targetResolutionDate': data.sla?.targetResolutionDate,
      'sla.responseBreached': data.sla?.responseBreached ?? false,
      'sla.resolutionBreached': data.sla?.resolutionBreached ?? false,
      'sla.pausedDuration': data.sla?.pausedDuration ?? 0,
      status: data.status,
      submittedAt: data.submittedAt || new Date(),
      source: data.source || 'web',
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      organizationId: data.organizationId,
    };

    // Remove undefined values
    for (const key of Object.keys(flat)) {
      if (flat[key] === undefined) delete flat[key];
    }

    return this.create(flat as any);
  }

  /**
   * Advanced search with role-based filtering.
   */
  async searchRequests(
    filters: Record<string, any>,
    itsmRole: string,
    userId: string,
    page = 1,
    limit = 25,
  ) {
    const pool = getPool();
    const offset = (page - 1) * limit;
    const params: any[] = [];
    let idx = 1;
    const conditions: string[] = [];

    if (filters.status) {
      conditions.push(`"status" = $${idx++}`);
      params.push(filters.status);
    }
    if (filters.serviceId) {
      conditions.push(`"service_id" = $${idx++}`);
      params.push(filters.serviceId);
    }
    if (filters.priority) {
      conditions.push(`"sla_priority" = $${idx++}`);
      params.push(filters.priority);
    }
    if (filters.requesterId) {
      conditions.push(`"requester_user_id" = $${idx++}`);
      params.push(filters.requesterId);
    }
    if (filters.assignedTo) {
      conditions.push(`"assigned_to_user_id" = $${idx++}`);
      params.push(filters.assignedTo);
    }

    // Role-based filtering: non-admins see only own or assigned
    if (itsmRole !== 'admin' && itsmRole !== 'manager') {
      conditions.push(`("requester_user_id" = $${idx} OR "assigned_to_user_id" = $${idx})`);
      params.push(userId);
      idx++;
    }

    // Text search
    if (filters.q) {
      conditions.push(`(
        "request_id" ILIKE $${idx} OR
        "service_name" ILIKE $${idx} OR
        "requester_name" ILIKE $${idx} OR
        "requester_email" ILIKE $${idx}
      )`);
      params.push(`%${filters.q}%`);
      idx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sortCol = this.toColumn(filters.sort || 'submittedAt');
    const sortDir = filters.sortDir === 'asc' ? 'ASC' : 'DESC';

    const [countRes, dataRes] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS total FROM "itsm_service_requests" ${where}`, params),
      pool.query(
        `SELECT * FROM "itsm_service_requests" ${where}
         ORDER BY "${sortCol}" ${sortDir}
         LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, limit, offset],
      ),
    ]);

    return {
      data: dataRes.rows.map((r: any) => this.mapRow(r)),
      total: countRes.rows[0]?.total || 0,
      page,
      limit,
      totalPages: Math.ceil((countRes.rows[0]?.total || 0) / limit),
    };
  }

  /**
   * Find by ID or requestId (mirrors $or: [{_id: id}, {requestId: id}]).
   */
  async findByIdOrRequestId(id: string) {
    const pool = getPool();
    const sql = `
      SELECT * FROM "itsm_service_requests"
      WHERE "id"::text = $1 OR "request_id" = $1
      LIMIT 1
    `;
    const result = await pool.query(sql, [id]);
    return result.rows.length > 0 ? this.mapRow(result.rows[0]) : null;
  }

  /**
   * Push to JSONB array columns (comments, stateHistory, approvals, etc).
   */
  async pushToJsonArray(id: string, column: string, item: any) {
    const col = this.toColumn(column);
    await getPool().query(
      `UPDATE "itsm_service_requests"
       SET "${col}" = "${col}" || $1::jsonb, "updated_at" = NOW()
       WHERE "id" = $2`,
      [JSON.stringify(item), id],
    );
  }
}
