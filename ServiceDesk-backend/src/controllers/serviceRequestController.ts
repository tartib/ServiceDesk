import { Request, Response } from 'express';
import ServiceRequest from '../core/entities/ServiceRequest';
import { ServiceRequestStatus, ApprovalStatus } from '../core/types/itsm.types';

// Helper to generate request ID
const generateRequestId = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const count = await ServiceRequest.countDocuments();
  return `SR-${year}-${String(count + 1).padStart(5, '0')}`;
};

export const serviceRequestController = {
  /**
   * Create a new service request
   */
  async create(req: Request, res: Response) {
    try {
      const requestId = await generateRequestId();
      
      // Calculate SLA dates (default 4 hours response, 24 hours resolution)
      const now = new Date();
      const responseDue = new Date(now.getTime() + 4 * 60 * 60 * 1000);
      const resolutionDue = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const serviceRequest = new ServiceRequest({
        request_id: requestId,
        ...req.body,
        sla: {
          sla_id: 'SLA-DEFAULT',
          response_due: responseDue,
          resolution_due: resolutionDue,
          ...req.body.sla,
        },
      });

      await serviceRequest.save();

      res.status(201).json({
        success: true,
        data: serviceRequest,
        message: 'Service request created successfully',
      });
    } catch (error) {
      console.error('Error creating service request:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating service request',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  /**
   * Get all service requests with filters
   */
  async getAll(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        priority,
        service_id,
        requester_id,
        assigned_to,
        search,
        sort_by = 'created_at',
        sort_order = 'desc',
      } = req.query;

      const query: Record<string, unknown> = {};

      if (status) query.status = status;
      if (priority) query.priority = priority;
      if (service_id) query.service_id = service_id;
      if (requester_id) query['requester.id'] = requester_id;
      if (assigned_to) query['assigned_to.technician_id'] = assigned_to;

      if (search) {
        query.$or = [
          { request_id: { $regex: search, $options: 'i' } },
          { service_name: { $regex: search, $options: 'i' } },
          { 'requester.name': { $regex: search, $options: 'i' } },
        ];
      }

      const skip = (Number(page) - 1) * Number(limit);
      const sortObj: Record<string, 1 | -1> = {
        [sort_by as string]: sort_order === 'asc' ? 1 : -1,
      };

      const [requests, total] = await Promise.all([
        ServiceRequest.find(query)
          .sort(sortObj)
          .skip(skip)
          .limit(Number(limit)),
        ServiceRequest.countDocuments(query),
      ]);

      res.json({
        success: true,
        data: requests,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error('Error fetching service requests:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching service requests',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  /**
   * Get service request by ID
   */
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // First try to find by request_id (e.g., SR-2025-00003)
      let request = await ServiceRequest.findOne({ request_id: id });

      // If not found and id looks like a MongoDB ObjectId, try _id
      if (!request && /^[0-9a-fA-F]{24}$/.test(id)) {
        request = await ServiceRequest.findById(id);
      }

      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Service request not found',
        });
      }

      res.json({
        success: true,
        data: request,
      });
    } catch (error) {
      console.error('Error fetching service request:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching service request',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  /**
   * Update service request
   */
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Build query based on ID format
      const query = /^[0-9a-fA-F]{24}$/.test(id) 
        ? { $or: [{ _id: id }, { request_id: id }] }
        : { request_id: id };

      const request = await ServiceRequest.findOneAndUpdate(
        query,
        req.body,
        { new: true, runValidators: true }
      );

      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Service request not found',
        });
      }

      res.json({
        success: true,
        data: request,
        message: 'Service request updated successfully',
      });
    } catch (error) {
      console.error('Error updating service request:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating service request',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  /**
   * Update status
   */
  async updateStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, notes, user_id, user_name } = req.body;

      if (!Object.values(ServiceRequestStatus).includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status',
        });
      }

      // Build query based on ID format
      const query = /^[0-9a-fA-F]{24}$/.test(id) 
        ? { $or: [{ _id: id }, { request_id: id }] }
        : { request_id: id };

      const request = await ServiceRequest.findOne(query);

      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Service request not found',
        });
      }

      request.status = status;
      
      // Add timeline event
      request.timeline.push({
        event: `Status changed to ${status}`,
        by: user_id || 'system',
        by_name: user_name || 'System',
        time: new Date(),
        details: { notes },
      });

      // Handle closed status
      if (status === ServiceRequestStatus.FULFILLED || status === ServiceRequestStatus.CANCELLED) {
        request.closed_at = new Date();
      }

      await request.save();

      res.json({
        success: true,
        data: request,
        message: 'Status updated successfully',
      });
    } catch (error) {
      console.error('Error updating status:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating status',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  /**
   * Approve/Reject request
   */
  async processApproval(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { decision, approver_id, approver_name, comments } = req.body;

      if (!['approve', 'reject'].includes(decision)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid decision. Must be "approve" or "reject"',
        });
      }

      // Build query based on ID format
      const query = /^[0-9a-fA-F]{24}$/.test(id) 
        ? { $or: [{ _id: id }, { request_id: id }] }
        : { request_id: id };

      const request = await ServiceRequest.findOne(query);

      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Service request not found',
        });
      }

      // Ensure approval_status is initialized
      if (!request.approval_status) {
        request.approval_status = {
          current_step: 0,
          total_steps: 1,
          approvals: [],
        };
      }

      const currentStep = request.approval_status.current_step || 0;
      const totalSteps = request.approval_status.total_steps || 1;
      const approval = request.approval_status.approvals?.find(a => a.step === currentStep);

      if (approval) {
        approval.status = decision === 'approve' ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED;
        approval.decision_at = new Date();
        approval.comments = comments;
      } else {
        if (!request.approval_status.approvals) {
          request.approval_status.approvals = [];
        }
        request.approval_status.approvals.push({
          step: currentStep,
          approver_id,
          approver_name,
          status: decision === 'approve' ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED,
          decision_at: new Date(),
          comments,
        });
      }

      // Update status based on decision
      if (decision === 'reject') {
        request.status = ServiceRequestStatus.REJECTED;
        request.closed_at = new Date();
      } else if (currentStep >= totalSteps - 1) {
        request.status = ServiceRequestStatus.APPROVED;
      } else {
        request.approval_status.current_step = currentStep + 1;
      }

      // Ensure timeline is initialized
      if (!request.timeline) {
        request.timeline = [];
      }

      // Add timeline event
      request.timeline.push({
        event: decision === 'approve' ? 'Request Approved' : 'Request Rejected',
        by: approver_id || 'unknown',
        by_name: approver_name || 'Unknown',
        time: new Date(),
        details: comments ? { comments } : {},
      });

      await request.save();

      res.json({
        success: true,
        data: request,
        message: `Request ${decision}d successfully`,
      });
    } catch (error) {
      console.error('Error processing approval:', error);
      res.status(500).json({
        success: false,
        message: 'Error processing approval',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  /**
   * Assign request to technician
   */
  async assign(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { technician_id, name, email, group_id, assigned_by, assigned_by_name } = req.body;

      // Build query based on ID format
      const query = /^[0-9a-fA-F]{24}$/.test(id) 
        ? { $or: [{ _id: id }, { request_id: id }] }
        : { request_id: id };

      const request = await ServiceRequest.findOne(query);

      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Service request not found',
        });
      }

      request.assigned_to = {
        technician_id,
        name,
        email,
        group_id,
      };

      if (request.status === ServiceRequestStatus.APPROVED) {
        request.status = ServiceRequestStatus.IN_PROGRESS;
      }

      request.timeline.push({
        event: `Assigned to ${name}`,
        by: assigned_by || 'system',
        by_name: assigned_by_name || 'System',
        time: new Date(),
      });

      await request.save();

      res.json({
        success: true,
        data: request,
        message: 'Request assigned successfully',
      });
    } catch (error) {
      console.error('Error assigning request:', error);
      res.status(500).json({
        success: false,
        message: 'Error assigning request',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  /**
   * Fulfill request
   */
  async fulfill(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { fulfilled_by, fulfilled_by_name, notes } = req.body;

      // Build query based on ID format
      const query = /^[0-9a-fA-F]{24}$/.test(id) 
        ? { $or: [{ _id: id }, { request_id: id }] }
        : { request_id: id };

      const request = await ServiceRequest.findOne(query);

      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Service request not found',
        });
      }

      request.status = ServiceRequestStatus.FULFILLED;
      request.fulfillment = {
        fulfilled_by,
        fulfilled_by_name,
        fulfilled_at: new Date(),
        notes,
      };
      request.closed_at = new Date();

      // Update SLA
      request.sla.resolved_at = new Date();
      request.sla.resolution_met = new Date() <= request.sla.resolution_due;

      request.timeline.push({
        event: 'Request Fulfilled',
        by: fulfilled_by,
        by_name: fulfilled_by_name,
        time: new Date(),
        details: { notes },
      });

      await request.save();

      res.json({
        success: true,
        data: request,
        message: 'Request fulfilled successfully',
      });
    } catch (error) {
      console.error('Error fulfilling request:', error);
      res.status(500).json({
        success: false,
        message: 'Error fulfilling request',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  /**
   * Get statistics
   */
  async getStats(req: Request, res: Response) {
    try {
      const [
        total,
        byStatus,
        byPriority,
        pendingApproval,
        breachedSLA,
        recentRequests,
      ] = await Promise.all([
        ServiceRequest.countDocuments(),
        ServiceRequest.aggregate([
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
        ServiceRequest.aggregate([
          { $group: { _id: '$priority', count: { $sum: 1 } } },
        ]),
        ServiceRequest.countDocuments({ status: ServiceRequestStatus.PENDING_APPROVAL }),
        ServiceRequest.countDocuments({ 'sla.breach_flag': true, closed_at: null }),
        ServiceRequest.find().sort({ created_at: -1 }).limit(5),
      ]);

      const statusStats: Record<string, number> = {};
      byStatus.forEach((item: { _id: string; count: number }) => {
        statusStats[item._id] = item.count;
      });

      const priorityStats: Record<string, number> = {};
      byPriority.forEach((item: { _id: string; count: number }) => {
        priorityStats[item._id] = item.count;
      });

      res.json({
        success: true,
        data: {
          total,
          by_status: statusStats,
          by_priority: priorityStats,
          pending_approval: pendingApproval,
          breached_sla: breachedSLA,
          recent_requests: recentRequests,
        },
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching stats',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  /**
   * Get my requests (for self-service)
   */
  async getMyRequests(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 10, status } = req.query;

      const query: Record<string, unknown> = { 'requester.id': userId };
      if (status) query.status = status;

      const skip = (Number(page) - 1) * Number(limit);

      const [requests, total] = await Promise.all([
        ServiceRequest.find(query)
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(Number(limit)),
        ServiceRequest.countDocuments(query),
      ]);

      res.json({
        success: true,
        data: requests,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error('Error fetching my requests:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching my requests',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
};
