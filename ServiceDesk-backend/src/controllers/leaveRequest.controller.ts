import { Request, Response } from 'express';
import LeaveRequest from '../models/LeaveRequest';

// List leave requests for a team (with filters)
export const getLeaveRequests = async (req: Request, res: Response) => {
  try {
    const { teamId, startDate, endDate, type, status, page = '1', limit = '50' } = req.query;

    const query: Record<string, unknown> = {};

    if (teamId) query.teamId = teamId;
    if (type) query.type = type;
    if (status) query.status = status;

    if (startDate || endDate) {
      query.startDate = {};
      if (endDate) (query as any).endDate = { $gte: new Date(startDate as string || '2000-01-01') };
      if (startDate) (query as any).startDate = { $lte: new Date(endDate as string || '2099-12-31') };
      // Overlapping range: request.startDate <= filter.endDate AND request.endDate >= filter.startDate
      query.$and = [
        { startDate: { $lte: new Date(endDate as string || '2099-12-31') } },
        { endDate: { $gte: new Date(startDate as string || '2000-01-01') } },
      ];
      delete query.startDate;
      delete (query as any).endDate;
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const [requests, total] = await Promise.all([
      LeaveRequest.find(query)
        .sort({ startDate: 1 })
        .skip(skip)
        .limit(limitNum)
        .populate('userId', 'name email profile.firstName profile.lastName profile.avatar')
        .populate('reviewedBy', 'name email profile.firstName profile.lastName')
        .lean(),
      LeaveRequest.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        requests,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch leave requests' });
  }
};

// Get current user's leave requests
export const getMyLeaveRequests = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { status, page = '1', limit = '20' } = req.query;

    const query: Record<string, unknown> = { userId };
    if (status) query.status = status;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [requests, total] = await Promise.all([
      LeaveRequest.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('teamId', 'name name_ar')
        .populate('reviewedBy', 'name email profile.firstName profile.lastName')
        .lean(),
      LeaveRequest.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        requests,
        pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch your leave requests' });
  }
};

// Create leave request
export const createLeaveRequest = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { teamId, type, startDate, endDate, reason } = req.body;

    if (!teamId || !type || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'teamId, type, startDate, and endDate are required' });
    }

    if (new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({ success: false, message: 'endDate must be after startDate' });
    }

    // Holidays and blackouts are auto-approved (team-wide entries)
    const autoApproveTypes = ['holiday', 'blackout'];
    const status = autoApproveTypes.includes(type) ? 'approved' : 'pending';

    const leaveRequest = new LeaveRequest({
      userId,
      teamId,
      type,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason: reason || '',
      status,
      ...(status === 'approved' ? { reviewedBy: userId, reviewedAt: new Date() } : {}),
    });

    await leaveRequest.save();

    const populated = await LeaveRequest.findById(leaveRequest._id)
      .populate('userId', 'name email profile.firstName profile.lastName profile.avatar')
      .populate('teamId', 'name name_ar')
      .lean();

    res.status(201).json({ success: true, data: { request: populated } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to create leave request' });
  }
};

// Update own pending leave request
export const updateLeaveRequest = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;
    const { type, startDate, endDate, reason } = req.body;

    const existing = await LeaveRequest.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }
    if (String(existing.userId) !== String(userId)) {
      return res.status(403).json({ success: false, message: 'You can only edit your own requests' });
    }
    if (existing.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending requests can be edited' });
    }

    const updateData: Record<string, unknown> = {};
    if (type !== undefined) updateData.type = type;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    if (reason !== undefined) updateData.reason = reason;

    const updated = await LeaveRequest.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true })
      .populate('userId', 'name email profile.firstName profile.lastName profile.avatar')
      .lean();

    res.status(200).json({ success: true, data: { request: updated } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update leave request' });
  }
};

// Delete own pending leave request
export const deleteLeaveRequest = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;

    const existing = await LeaveRequest.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }
    if (String(existing.userId) !== String(userId)) {
      return res.status(403).json({ success: false, message: 'You can only delete your own requests' });
    }
    if (existing.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending requests can be deleted' });
    }

    await LeaveRequest.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Leave request deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to delete leave request' });
  }
};

// Approve leave request
export const approveLeaveRequest = async (req: Request, res: Response) => {
  try {
    const reviewerId = (req as any).user?.id;
    const { id } = req.params;

    const request = await LeaveRequest.findByIdAndUpdate(
      id,
      {
        $set: {
          status: 'approved',
          reviewedBy: reviewerId,
          reviewedAt: new Date(),
        },
      },
      { new: true }
    )
      .populate('userId', 'name email profile.firstName profile.lastName profile.avatar')
      .populate('reviewedBy', 'name email profile.firstName profile.lastName')
      .lean();

    if (!request) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    res.status(200).json({ success: true, data: { request } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to approve leave request' });
  }
};

// Reject leave request
export const rejectLeaveRequest = async (req: Request, res: Response) => {
  try {
    const reviewerId = (req as any).user?.id;
    const { id } = req.params;
    const { reviewNote } = req.body;

    const request = await LeaveRequest.findByIdAndUpdate(
      id,
      {
        $set: {
          status: 'rejected',
          reviewedBy: reviewerId,
          reviewedAt: new Date(),
          reviewNote: reviewNote || '',
        },
      },
      { new: true }
    )
      .populate('userId', 'name email profile.firstName profile.lastName profile.avatar')
      .populate('reviewedBy', 'name email profile.firstName profile.lastName')
      .lean();

    if (!request) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    res.status(200).json({ success: true, data: { request } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to reject leave request' });
  }
};
