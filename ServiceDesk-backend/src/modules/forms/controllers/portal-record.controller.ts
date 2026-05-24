/**
 * Portal Record Controller — Client-facing record endpoints
 * Section 2, Batch 5
 *
 * All routes are guarded by portalAuth middleware (no JWT).
 * Clients can only see their own records.
 */

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import type { PortalRequest } from '../../portal/portal.middleware';

const isValidObjectId = (id: string) => mongoose.Types.ObjectId.isValid(id);

export const portalRecordController = {
  /** GET /api/v2/portal/records — list client's own records */
  async listMyRecords(req: Request, res: Response) {
    try {
      const session = (req as PortalRequest).portalSession;
      if (!session) return res.status(401).json({ success: false, error: 'Not authenticated' });

      const RecordItemModel = (await import('../models/RecordItem')).default;

      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
      const skip = (page - 1) * limit;

      const filter: Record<string, unknown> = {
        organizationId: session.organizationId,
        requesterEmail: session.clientEmail,
      };

      if (req.query.status) {
        filter.status = req.query.status;
      }

      const [records, total] = await Promise.all([
        RecordItemModel.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .select('-assigneeId -assigneeName -sla')
          .lean(),
        RecordItemModel.countDocuments(filter),
      ]);

      return res.json({
        success: true,
        data: {
          records,
          total,
          page,
          limit,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list records',
      });
    }
  },

  /** GET /api/v2/portal/records/:id — get a single record (own only) */
  async getMyRecord(req: Request, res: Response) {
    try {
      const session = (req as PortalRequest).portalSession;
      if (!session) return res.status(401).json({ success: false, error: 'Not authenticated' });

      if (!isValidObjectId(req.params.id as string)) {
        return res.status(400).json({ success: false, error: 'Invalid record ID' });
      }

      const RecordItemModel = (await import('../models/RecordItem')).default;

      const record = await RecordItemModel.findOne({
        _id: req.params.id,
        organizationId: session.organizationId,
        requesterEmail: session.clientEmail,
      })
        .select('-assigneeId -assigneeName')
        .lean();

      if (!record) {
        return res.status(404).json({ success: false, error: 'Record not found' });
      }

      return res.json({ success: true, data: record });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get record',
      });
    }
  },

  /** POST /api/v2/portal/records — submit a new request */
  async submitRequest(req: Request, res: Response) {
    try {
      const session = (req as PortalRequest).portalSession;
      if (!session) return res.status(401).json({ success: false, error: 'Not authenticated' });

      const RecordItemModel = (await import('../models/RecordItem')).default;
      const { RecordItemStatus, RecordPriority, RecordSourceType } = await import('../models/RecordItem');

      const { title, description, requestTypeId, priority } = req.body;

      if (!title || typeof title !== 'string' || title.trim().length === 0) {
        return res.status(400).json({ success: false, error: 'Title is required' });
      }

      if (description !== undefined && typeof description !== 'string') {
        return res.status(400).json({ success: false, error: 'Description must be a string' });
      }

      if (requestTypeId && !isValidObjectId(requestTypeId)) {
        return res.status(400).json({ success: false, error: 'Invalid request type ID' });
      }

      const doc = new RecordItemModel({
        title: title.trim(),
        description: description?.trim(),
        requestTypeId,
        status: RecordItemStatus.SUBMITTED,
        priority: priority || RecordPriority.MEDIUM,
        requesterId: session.tokenId,
        requesterName: session.clientEmail,
        requesterEmail: session.clientEmail,
        sourceType: RecordSourceType.RECORD,
        organizationId: session.organizationId,
      });

      await doc.generateRecordNumber();
      await doc.save();

      return res.status(201).json({ success: true, data: doc.toJSON() });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit request',
      });
    }
  },

  /** PATCH /api/v2/portal/records/:id/approve — client approval */
  async approveRecord(req: Request, res: Response) {
    try {
      const session = (req as PortalRequest).portalSession;
      if (!session) return res.status(401).json({ success: false, error: 'Not authenticated' });

      const RecordItemModel = (await import('../models/RecordItem')).default;
      const { RecordItemStatus } = await import('../models/RecordItem');

      const { action, comments } = req.body; // action: 'approve' | 'reject' | 'request_changes'

      if (!action || typeof action !== 'string' || !['approve', 'reject', 'request_changes'].includes(action)) {
        return res.status(400).json({ success: false, error: 'Invalid action. Must be approve, reject, or request_changes' });
      }

      if (!isValidObjectId(req.params.id as string)) {
        return res.status(400).json({ success: false, error: 'Invalid record ID' });
      }

      const record = await RecordItemModel.findOne({
        _id: req.params.id,
        organizationId: session.organizationId,
        requesterEmail: session.clientEmail,
        status: RecordItemStatus.WAITING_CLIENT,
      });

      if (!record) {
        return res.status(404).json({ success: false, error: 'Record not found or not awaiting approval' });
      }

      const statusMap: Record<string, string> = {
        approve: RecordItemStatus.APPROVED,
        reject: RecordItemStatus.REJECTED,
        request_changes: RecordItemStatus.UNDER_REVIEW,
      };

      record.status = statusMap[action] as any;
      await record.save();

      return res.json({ success: true, data: record.toJSON() });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process approval',
      });
    }
  },
};
