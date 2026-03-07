import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { ServiceRequest, ServiceRequestStatus, ApprovalDecision, RequestPriority } from '../models';
import { ServiceCatalog } from '../models';
// UserRole import removed — authorization now handled by itsmAuthorize middleware
import { ApiResponse } from '../../../types/pm';
import logger from '../../../utils/logger';
import { ItsmEventPublisher } from '../../../shared/events/publishers/itsm.publisher';
import { getItsmRepos, isItsmPostgres } from '../infrastructure/repositories';
import { PgServiceRequestRepository } from '../infrastructure/repositories/PgServiceRequestRepository';
import { PgServiceCatalogRepository } from '../infrastructure/repositories/PgServiceCatalogRepository';

/**
 * Service Request Controller
 * Handles service request operations
 */

// POST /api/v2/itsm/requests - Submit new service request
export const createRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array().map((e) => ({ field: e.type, message: e.msg })),
      } as ApiResponse);
      return;
    }

    const { serviceId, formData, onBehalfOf, source = 'web' } = req.body;
    const userId = req.user?.id;
    const userName = req.user?.name || '';
    const userEmail = req.user?.email || '';
    const userDepartment = req.user?.department || '';
    const usePg = isItsmPostgres();

    // Verify service exists and is active
    let service: any;
    if (usePg) {
      const catRepo = getItsmRepos().serviceCatalog as PgServiceCatalogRepository;
      service = await catRepo.findByServiceId(serviceId) || await catRepo.findById(serviceId);
      if (service && service.status !== 'active') service = null;
    } else {
      service = await ServiceCatalog.findOne({
        $or: [{ _id: serviceId }, { serviceId: serviceId }],
        status: 'active',
      });
    }

    if (!service) {
      res.status(404).json({
        success: false,
        error: 'Service not found or inactive',
      } as ApiResponse);
      return;
    }

    // Check visibility permissions
    const itsmRole = req.user?.itsmRole || 'end_user';
    if (service.visibility === 'restricted') {
      if (
        itsmRole !== 'admin' &&
        itsmRole !== 'manager' &&
        !service.allowedRoles?.includes(itsmRole)
      ) {
        res.status(403).json({
          success: false,
          error: 'Access denied to this service',
        } as ApiResponse);
        return;
      }
    }

    // Calculate SLA targets based on priority
    const priority = service.priority || 'medium';
    const slaHours = {
      low: { response: 24, resolution: 72 },
      medium: { response: 8, resolution: 24 },
      high: { response: 4, resolution: 8 },
      critical: { response: 1, resolution: 4 },
    };
    const hours = slaHours[priority as keyof typeof slaHours] || slaHours.medium;
    const now = new Date();

    const requestPayload = {
      serviceId: service.serviceId,
      serviceName: service.name,
      serviceNameAr: service.nameAr,
      serviceCategory: service.category,
      requester: {
        userId,
        name: userName,
        email: userEmail,
        department: userDepartment,
      },
      onBehalfOf: onBehalfOf
        ? {
            userId: onBehalfOf.userId,
            name: onBehalfOf.name,
            email: onBehalfOf.email,
            department: onBehalfOf.department,
          }
        : undefined,
      formData,
      formDataDisplay: Object.entries(formData).map(([key, value]) => ({
        fieldId: key,
        label: key,
        value: String(value),
        displayValue: String(value),
      })),
      currentState: service.approvalRequired ? 'pending_approval' : 'submitted',
      stateHistory: [
        {
          state: 'submitted',
          enteredAt: now,
          actorId: userId,
          actorName: userName,
          action: 'submit',
        },
      ],
      approvalStage: service.approvalRequired ? 'initial' : undefined,
      approvals: service.approvalRequired
        ? service.approvers?.map((_approver: any, index: number) => ({
            stageId: `stage-${index}`,
            stageName: 'Initial Approval',
            approverId: '',
            approverName: '',
            decision: ApprovalDecision.PENDING,
            dueDate: new Date(now.getTime() + 24 * 60 * 60 * 1000),
          }))
        : [],
      fulfillmentTasks: [],
      sla: {
        priority: priority as RequestPriority,
        targetResponseTime: hours.response,
        targetResolutionTime: hours.resolution,
        targetResponseDate: new Date(now.getTime() + hours.response * 60 * 60 * 1000),
        targetResolutionDate: new Date(now.getTime() + hours.resolution * 60 * 60 * 1000),
        responseBreached: false,
        resolutionBreached: false,
        pausedDuration: 0,
      },
      status: service.approvalRequired
        ? ServiceRequestStatus.UNDER_REVIEW
        : ServiceRequestStatus.SUBMITTED,
      submittedAt: now,
      source,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    };

    let request: any;
    if (usePg) {
      const reqRepo = getItsmRepos().serviceRequest as PgServiceRequestRepository;
      request = await reqRepo.createRequest(requestPayload);
      // Update service stats
      const catRepo = getItsmRepos().serviceCatalog as PgServiceCatalogRepository;
      await catRepo.incrementStats((service as any)._id || (service as any).id, 'totalRequests');
    } else {
      request = await ServiceRequest.create(requestPayload);
      // Update service stats
      await ServiceCatalog.updateOne(
        { _id: service._id },
        {
          $inc: { 'stats.totalRequests': 1 },
          $set: { 'stats.lastRequestedAt': now },
        }
      );
    }

    // Emit event
    ItsmEventPublisher.serviceRequestCreated(
      {
        requestId: request.requestId,
        serviceId: service.serviceId,
        serviceName: service.name,
        priority: priority,
        requesterId: userId || '',
        requesterName: userName,
      },
      { organizationId: req.user?.organizationId || '', userId: userId || '' }
    ).catch((err) => logger.error('Failed to emit serviceRequestCreated', { err }));

    res.status(201).json({
      success: true,
      data: request,
      message: 'Service request submitted successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Create service request error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit service request',
    } as ApiResponse);
  }
};

// GET /api/v2/itsm/requests - List service requests
export const getRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      status,
      serviceId,
      requesterId,
      assignedTo,
      priority,
      q,
      page = '1',
      limit = '25',
      sort = 'submittedAt',
      sortDir = 'desc',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 25));
    const itsmRole = req.user?.itsmRole || 'end_user';
    const userId = req.user?.id;

    // ── PostgreSQL path ──
    if (isItsmPostgres()) {
      const repo = getItsmRepos().serviceRequest as PgServiceRequestRepository;
      const result = await repo.searchRequests(
        {
          status: status as string,
          serviceId: serviceId as string,
          requesterId: requesterId as string,
          assignedTo: assignedTo as string,
          priority: priority as string,
          q: q as string,
          sort: sort as string,
          sortDir: sortDir as string,
        },
        itsmRole,
        userId || '',
        pageNum,
        limitNum,
      );

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      } as ApiResponse);
      return;
    }

    // ── MongoDB path (unchanged) ──
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query: Record<string, unknown> = {};

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by service
    if (serviceId) {
      query.serviceId = serviceId;
    }

    // Filter by priority
    if (priority) {
      query['sla.priority'] = priority;
    }

    // Role-based filtering
    if (itsmRole !== 'admin' && itsmRole !== 'manager') {
      // Regular users see their own requests or those assigned to them
      query.$or = [
        { 'requester.userId': userId },
        { 'assignedTo.userId': userId },
      ];
    }

    // Filter by requester
    if (requesterId) {
      query['requester.userId'] = requesterId;
    }

    // Filter by assignee
    if (assignedTo) {
      query['assignedTo.userId'] = assignedTo;
    }

    // Text search
    if (q) {
      query.$and = [
        {
          $or: [
            { requestId: { $regex: q, $options: 'i' } },
            { serviceName: { $regex: q, $options: 'i' } },
            { 'requester.name': { $regex: q, $options: 'i' } },
            { 'requester.email': { $regex: q, $options: 'i' } },
          ],
        },
      ];
    }

    // Build sort
    const sortOption: Record<string, 1 | -1> = {};
    sortOption[sort as string] = sortDir === 'desc' ? -1 : 1;

    // Execute query
    const [requests, total] = await Promise.all([
      ServiceRequest.find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      ServiceRequest.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: requests,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    } as ApiResponse);
  } catch (error) {
    logger.error('Get service requests error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch service requests',
    } as ApiResponse);
  }
};

// GET /api/v2/itsm/requests/:id - Get single request
export const getRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const itsmRole = req.user?.itsmRole || 'end_user';

    let request: any;
    if (isItsmPostgres()) {
      const repo = getItsmRepos().serviceRequest as PgServiceRequestRepository;
      request = await repo.findByIdOrRequestId(id);
    } else {
      request = await ServiceRequest.findOne({
        $or: [{ _id: id }, { requestId: id }],
      }).lean();
    }

    if (!request) {
      res.status(404).json({
        success: false,
        error: 'Service request not found',
      } as ApiResponse);
      return;
    }

    // Check permissions
    const reqUserId = request.requester?.userId || request.requesterUserId;
    const assignedUserId = request.assignedTo?.userId || request.assignedToUserId;
    const isAuthorized =
      itsmRole === 'admin' ||
      itsmRole === 'manager' ||
      reqUserId === userId ||
      assignedUserId === userId;

    if (!isAuthorized) {
      res.status(403).json({
        success: false,
        error: 'Access denied to this request',
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      data: request,
    } as ApiResponse);
  } catch (error) {
    logger.error('Get service request error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch service request',
    } as ApiResponse);
  }
};

// POST /api/v2/itsm/requests/:id/approve - Approve request
export const approveRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const userId = req.user?.id;
    const userName = req.user?.name || '';

    // ── PostgreSQL path ──
    if (isItsmPostgres()) {
      const repo = getItsmRepos().serviceRequest as PgServiceRequestRepository;
      const request = await repo.findByIdOrRequestId(id);
      if (!request) {
        res.status(404).json({ success: false, error: 'Service request not found' } as ApiResponse);
        return;
      }
      const rid = (request as any)._id || (request as any).id;
      // Update approval in JSONB
      const approvals = (request as any).approvals || [];
      const pendingIdx = approvals.findIndex((a: any) => a.decision === ApprovalDecision.PENDING);
      if (pendingIdx >= 0) {
        approvals[pendingIdx] = { ...approvals[pendingIdx], decision: ApprovalDecision.APPROVED, approverId: userId || '', approverName: userName, comment, timestamp: new Date() };
      }
      await repo.updateById(rid, {
        status: ServiceRequestStatus.APPROVED,
        currentState: 'approved',
        approvals: JSON.stringify(approvals),
      } as any);
      await repo.pushToJsonArray(rid, 'stateHistory', { state: 'approved', enteredAt: new Date(), actorId: userId || '', actorName: userName, action: 'approve', comment });

      ItsmEventPublisher.serviceRequestApproved(
        { requestId: (request as any).requestId, approvedBy: userId || '', approverRole: req.user?.itsmRole || 'end_user', decision: 'approved' },
        { organizationId: req.user?.organizationId || '', userId: userId || '' }
      ).catch((err) => logger.error('Failed to emit serviceRequestApproved', { err }));

      const updated = await repo.findById(rid);
      res.status(200).json({ success: true, data: updated, message: 'Request approved successfully' } as ApiResponse);
      return;
    }

    // ── MongoDB path ──
    const request = await ServiceRequest.findOne({
      $or: [{ _id: id }, { requestId: id }],
    });

    if (!request) {
      res.status(404).json({
        success: false,
        error: 'Service request not found',
      } as ApiResponse);
      return;
    }

    // Update approval
    const approval = request.approvals.find((a) => a.decision === ApprovalDecision.PENDING);
    if (approval) {
      approval.decision = ApprovalDecision.APPROVED;
      approval.approverId = userId || '';
      approval.approverName = userName;
      approval.comment = comment;
      approval.timestamp = new Date();
    }

    // Update request status
    request.status = ServiceRequestStatus.APPROVED;
    request.currentState = 'approved';
    request.stateHistory.push({
      state: 'approved',
      enteredAt: new Date(),
      actorId: userId || '',
      actorName: userName,
      action: 'approve',
      comment: comment,
    });

    await request.save();

    // Emit event
    ItsmEventPublisher.serviceRequestApproved(
      {
        requestId: request.requestId,
        approvedBy: userId || '',
        approverRole: req.user?.itsmRole || 'end_user',
        decision: 'approved',
      },
      { organizationId: req.user?.organizationId || '', userId: userId || '' }
    ).catch((err) => logger.error('Failed to emit serviceRequestApproved', { err }));

    res.status(200).json({
      success: true,
      data: request,
      message: 'Request approved successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Approve request error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve request',
    } as ApiResponse);
  }
};

// POST /api/v2/itsm/requests/:id/reject - Reject request
export const rejectRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user?.id;
    const userName = req.user?.name || '';

    if (!reason) {
      res.status(400).json({
        success: false,
        error: 'Rejection reason is required',
      } as ApiResponse);
      return;
    }

    // ── PostgreSQL path ──
    if (isItsmPostgres()) {
      const repo = getItsmRepos().serviceRequest as PgServiceRequestRepository;
      const request = await repo.findByIdOrRequestId(id);
      if (!request) {
        res.status(404).json({ success: false, error: 'Service request not found' } as ApiResponse);
        return;
      }
      const rid = (request as any)._id || (request as any).id;
      const approvals = (request as any).approvals || [];
      const pendingIdx = approvals.findIndex((a: any) => a.decision === ApprovalDecision.PENDING);
      if (pendingIdx >= 0) {
        approvals[pendingIdx] = { ...approvals[pendingIdx], decision: ApprovalDecision.REJECTED, approverId: userId || '', approverName: userName, comment: reason, timestamp: new Date() };
      }
      await repo.updateById(rid, {
        status: ServiceRequestStatus.REJECTED,
        currentState: 'rejected',
        approvals: JSON.stringify(approvals),
      } as any);
      await repo.pushToJsonArray(rid, 'stateHistory', { state: 'rejected', enteredAt: new Date(), actorId: userId || '', actorName: userName, action: 'reject', comment: reason });
      const updated = await repo.findById(rid);
      res.status(200).json({ success: true, data: updated, message: 'Request rejected' } as ApiResponse);
      return;
    }

    // ── MongoDB path ──
    const request = await ServiceRequest.findOne({
      $or: [{ _id: id }, { requestId: id }],
    });

    if (!request) {
      res.status(404).json({
        success: false,
        error: 'Service request not found',
      } as ApiResponse);
      return;
    }

    // Update approval
    const approval = request.approvals.find((a) => a.decision === ApprovalDecision.PENDING);
    if (approval) {
      approval.decision = ApprovalDecision.REJECTED;
      approval.approverId = userId || '';
      approval.approverName = userName;
      approval.comment = reason;
      approval.timestamp = new Date();
    }

    // Update request status
    request.status = ServiceRequestStatus.REJECTED;
    request.currentState = 'rejected';
    request.stateHistory.push({
      state: 'rejected',
      enteredAt: new Date(),
      actorId: userId || '',
      actorName: userName,
      action: 'reject',
      comment: reason,
    });

    await request.save();

    res.status(200).json({
      success: true,
      data: request,
      message: 'Request rejected',
    } as ApiResponse);
  } catch (error) {
    logger.error('Reject request error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject request',
    } as ApiResponse);
  }
};

// POST /api/v2/itsm/requests/:id/cancel - Cancel request
export const cancelRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user?.id;
    const userName = req.user?.name || '';

    // ── PostgreSQL path ──
    if (isItsmPostgres()) {
      const repo = getItsmRepos().serviceRequest as PgServiceRequestRepository;
      const request = await repo.findByIdOrRequestId(id);
      if (!request) {
        res.status(404).json({ success: false, error: 'Service request not found' } as ApiResponse);
        return;
      }
      const rid = (request as any)._id || (request as any).id;
      const reqUserId = (request as any).requester?.userId || (request as any).requesterUserId;
      const itsmRole = req.user?.itsmRole || 'end_user';
      if (reqUserId !== userId && itsmRole !== 'manager' && itsmRole !== 'admin') {
        res.status(403).json({ success: false, error: 'Only the requester or admin can cancel' } as ApiResponse);
        return;
      }
      if ((request as any).status === ServiceRequestStatus.COMPLETED) {
        res.status(400).json({ success: false, error: 'Cannot cancel a completed request' } as ApiResponse);
        return;
      }
      await repo.updateById(rid, {
        status: ServiceRequestStatus.CANCELLED,
        currentState: 'cancelled',
        cancelledAt: new Date(),
        cancelledBy: userId,
        cancellationReason: reason,
      } as any);
      await repo.pushToJsonArray(rid, 'stateHistory', { state: 'cancelled', enteredAt: new Date(), actorId: userId || '', actorName: userName, action: 'cancel', comment: reason });

      ItsmEventPublisher.serviceRequestCancelled(
        { requestId: (request as any).requestId, cancelledBy: userId || '', reason },
        { organizationId: req.user?.organizationId || '', userId: userId || '' }
      ).catch((err) => logger.error('Failed to emit serviceRequestCancelled', { err }));

      const updated = await repo.findById(rid);
      res.status(200).json({ success: true, data: updated, message: 'Request cancelled' } as ApiResponse);
      return;
    }

    // ── MongoDB path ──
    const request = await ServiceRequest.findOne({
      $or: [{ _id: id }, { requestId: id }],
    });

    if (!request) {
      res.status(404).json({
        success: false,
        error: 'Service request not found',
      } as ApiResponse);
      return;
    }

    // Only requester or admin/manager can cancel
    const itsmRole = req.user?.itsmRole || 'end_user';
    if (request.requester.userId !== userId && itsmRole !== 'manager' && itsmRole !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Only the requester or admin can cancel',
      } as ApiResponse);
      return;
    }

    // Cannot cancel completed requests
    if (request.status === ServiceRequestStatus.COMPLETED) {
      res.status(400).json({
        success: false,
        error: 'Cannot cancel a completed request',
      } as ApiResponse);
      return;
    }

    request.status = ServiceRequestStatus.CANCELLED;
    request.currentState = 'cancelled';
    request.cancelledAt = new Date();
    request.cancelledBy = userId;
    request.cancellationReason = reason;
    request.stateHistory.push({
      state: 'cancelled',
      enteredAt: new Date(),
      actorId: userId || '',
      actorName: userName,
      action: 'cancel',
      comment: reason,
    });

    await request.save();

    // Emit event
    ItsmEventPublisher.serviceRequestCancelled(
      {
        requestId: request.requestId,
        cancelledBy: userId || '',
        reason,
      },
      { organizationId: req.user?.organizationId || '', userId: userId || '' }
    ).catch((err) => logger.error('Failed to emit serviceRequestCancelled', { err }));

    res.status(200).json({
      success: true,
      data: request,
      message: 'Request cancelled',
    } as ApiResponse);
  } catch (error) {
    logger.error('Cancel request error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel request',
    } as ApiResponse);
  }
};

// POST /api/v2/itsm/requests/:id/assign - Assign request to agent
export const assignRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { assigneeId, assigneeName, team } = req.body;
    const userId = req.user?.id;
    const userName = req.user?.name || '';

    // ── PostgreSQL path ──
    if (isItsmPostgres()) {
      const repo = getItsmRepos().serviceRequest as PgServiceRequestRepository;
      const request = await repo.findByIdOrRequestId(id);
      if (!request) {
        res.status(404).json({ success: false, error: 'Service request not found' } as ApiResponse);
        return;
      }
      const rid = (request as any)._id || (request as any).id;
      const updateData: Record<string, any> = {
        'assignedTo.userId': assigneeId,
        'assignedTo.name': assigneeName,
        'assignedTo.assignedAt': new Date(),
        'assignedTo.assignedBy': userId || '',
      };
      if (team) updateData.assignedTeam = team;
      await repo.updateById(rid, updateData as any);
      await repo.pushToJsonArray(rid, 'stateHistory', { state: (request as any).currentState, enteredAt: new Date(), actorId: userId || '', actorName: userName, action: 'assign', comment: `Assigned to ${assigneeName}` });

      ItsmEventPublisher.serviceRequestAssigned(
        { requestId: (request as any).requestId, assignedTo: assigneeId, assignedBy: userId || '' },
        { organizationId: req.user?.organizationId || '', userId: userId || '' }
      ).catch((err) => logger.error('Failed to emit serviceRequestAssigned', { err }));

      const updated = await repo.findById(rid);
      res.status(200).json({ success: true, data: updated, message: 'Request assigned successfully' } as ApiResponse);
      return;
    }

    // ── MongoDB path ──
    const request = await ServiceRequest.findOne({
      $or: [{ _id: id }, { requestId: id }],
    });

    if (!request) {
      res.status(404).json({
        success: false,
        error: 'Service request not found',
      } as ApiResponse);
      return;
    }

    request.assignedTo = {
      userId: assigneeId,
      name: assigneeName,
      assignedAt: new Date(),
      assignedBy: userId || '',
    };
    if (team) {
      request.assignedTeam = team;
    }
    request.stateHistory.push({
      state: request.currentState,
      enteredAt: new Date(),
      actorId: userId || '',
      actorName: userName,
      action: 'assign',
      comment: `Assigned to ${assigneeName}`,
    });

    await request.save();

    // Emit event
    ItsmEventPublisher.serviceRequestAssigned(
      {
        requestId: request.requestId,
        assignedTo: assigneeId,
        assignedBy: userId || '',
      },
      { organizationId: req.user?.organizationId || '', userId: userId || '' }
    ).catch((err) => logger.error('Failed to emit serviceRequestAssigned', { err }));

    res.status(200).json({
      success: true,
      data: request,
      message: 'Request assigned successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Assign request error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign request',
    } as ApiResponse);
  }
};

// POST /api/v2/itsm/requests/:id/comment - Add comment to request
export const addComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { message, isInternal = false } = req.body;
    const userId = req.user?.id;
    const userName = req.user?.name || '';
    const itsmRole = req.user?.itsmRole || 'end_user';

    if (!message || message.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'Comment message is required',
      } as ApiResponse);
      return;
    }

    // ── PostgreSQL path ──
    if (isItsmPostgres()) {
      const repo = getItsmRepos().serviceRequest as PgServiceRequestRepository;
      const request = await repo.findByIdOrRequestId(id);
      if (!request) {
        res.status(404).json({ success: false, error: 'Service request not found' } as ApiResponse);
        return;
      }
      const rid = (request as any)._id || (request as any).id;
      const comment = {
        commentId: `C-${Date.now()}`,
        authorId: userId || '',
        authorName: userName,
        authorRole: itsmRole || 'end_user',
        message: message.trim(),
        isInternal,
        createdAt: new Date(),
      };
      await repo.pushToJsonArray(rid, 'comments', comment);
      res.status(201).json({ success: true, data: comment, message: 'Comment added' } as ApiResponse);
      return;
    }

    // ── MongoDB path ──
    const request = await ServiceRequest.findOne({
      $or: [{ _id: id }, { requestId: id }],
    });

    if (!request) {
      res.status(404).json({
        success: false,
        error: 'Service request not found',
      } as ApiResponse);
      return;
    }

    const comment = {
      commentId: `C-${Date.now()}`,
      authorId: userId || '',
      authorName: userName,
      authorRole: itsmRole || 'end_user',
      message: message.trim(),
      isInternal,
      createdAt: new Date(),
    };

    request.comments.push(comment);
    await request.save();

    res.status(201).json({
      success: true,
      data: comment,
      message: 'Comment added',
    } as ApiResponse);
  } catch (error) {
    logger.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add comment',
    } as ApiResponse);
  }
};
