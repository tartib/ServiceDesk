/**
 * Record Controller — Endpoints for the unified record flow.
 *
 * Uses RecordService's full-record methods (RecordItem + FormSubmission).
 * Gated by feature flag `new_request_flow` at the route level.
 */

import { Request, Response, NextFunction } from 'express';
import { recordService } from '../services/RecordService';
import type { RecordItemStatus } from '../models/RecordItem';
import type { RecordPriority } from '../models/RecordItem';
import type { WorkspaceType } from '../../../shared/types/workspace.types';

export async function createRecord(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = req.user!.organizationId ?? (req.headers['x-organization-id'] as string);
    if (!orgId) {
      res.status(400).json({ error: 'Organization ID required', code: 'MISSING_ORG_ID' });
      return;
    }

    const {
      title,
      description,
      requestTypeId,
      workspaceType,
      priority,
      formTemplateId,
      formData,
      attachments,
      isDraft,
      siteId,
    } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      res.status(400).json({ error: 'Title is required', code: 'VALIDATION_ERROR' });
      return;
    }
    if (!formTemplateId) {
      res.status(400).json({ error: 'Form template ID is required', code: 'VALIDATION_ERROR' });
      return;
    }

    const result = await recordService.createFullRecord({
      title: title.trim(),
      description: description?.trim(),
      requestTypeId,
      workspaceType,
      priority,
      formTemplateId,
      formData: formData ?? {},
      attachments,
      submittedBy: {
        userId: req.user!.id,
        name: req.user!.name,
        email: req.user!.email,
        department: req.user!.department,
        siteId: req.user!.site_id,
      },
      organizationId: orgId,
      siteId: siteId ?? req.user!.site_id,
      isDraft,
    });

    res.status(201).json({
      recordItem: result.recordItem,
      submissionId: result.submission.submission_id,
    });
  } catch (err) {
    next(err);
  }
}

export async function getRecord(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params as Record<string, string>;
    const result = await recordService.getFullRecord(id);

    if (!result) {
      res.status(404).json({ error: 'Record not found', code: 'NOT_FOUND' });
      return;
    }

    const detail = result.submission
      ? recordService.toRecordDetail(result.submission)
      : null;

    res.json({ recordItem: result.recordItem, detail });
  } catch (err) {
    next(err);
  }
}

export async function listRecords(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = req.user!.organizationId ?? (req.headers['x-organization-id'] as string);
    if (!orgId) {
      res.status(400).json({ error: 'Organization ID required', code: 'MISSING_ORG_ID' });
      return;
    }

    const {
      status,
      assigneeId,
      requesterId,
      requestTypeId,
      workspaceType,
      sourceType,
      search,
      page,
      limit,
      sortBy,
      sortOrder,
    } = req.query as Record<string, string>;

    const result = await recordService.listRecordItems({
      organizationId: orgId,
      status: status as RecordItemStatus | undefined,
      assigneeId,
      requesterId,
      requestTypeId,
      workspaceType: workspaceType as WorkspaceType | undefined,
      sourceType: sourceType as any,
      search,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      sortBy,
      sortOrder: sortOrder as 'asc' | 'desc' | undefined,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateRecordStatus(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params as Record<string, string>;
    const { status } = req.body;

    if (!status) {
      res.status(400).json({ error: 'Status is required', code: 'VALIDATION_ERROR' });
      return;
    }

    const item = await recordService.updateRecordItemStatus(
      id,
      status as RecordItemStatus,
      req.user!.id,
    );

    if (!item) {
      res.status(404).json({ error: 'Record not found', code: 'NOT_FOUND' });
      return;
    }

    res.json(item);
  } catch (err) {
    next(err);
  }
}

export async function assignRecord(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params as Record<string, string>;
    const { assigneeId, assigneeName } = req.body;

    if (!assigneeId) {
      res.status(400).json({ error: 'Assignee ID is required', code: 'VALIDATION_ERROR' });
      return;
    }

    const item = await recordService.assignRecordItem(
      id,
      assigneeId,
      assigneeName ?? '',
    );

    if (!item) {
      res.status(404).json({ error: 'Record not found', code: 'NOT_FOUND' });
      return;
    }

    res.json(item);
  } catch (err) {
    next(err);
  }
}

export async function updateDraft(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params as Record<string, string>;
    const { title, description, formData, priority } = req.body;

    // Only allow updating own drafts
    const RecordItemModel = (await import('../models/RecordItem')).default;
    const { RecordItemStatus } = await import('../models/RecordItem');

    const recordItem = await RecordItemModel.findOne({
      _id: id,
      requesterId: req.user!.id,
      status: RecordItemStatus.DRAFT,
    });

    if (!recordItem) {
      res.status(404).json({ error: 'Draft not found or not owned by user', code: 'NOT_FOUND' });
      return;
    }

    // Update RecordItem metadata
    if (title) recordItem.title = title.trim();
    if (description !== undefined) recordItem.description = description?.trim();
    if (priority) recordItem.priority = priority;
    await recordItem.save();

    // Update form data if provided
    if (formData && recordItem.formSubmissionId) {
      const { formSubmissionService } = await import('../services/formSubmissionService');
      await formSubmissionService.updateSubmission(recordItem.formSubmissionId, {
        data: formData,
        updated_by: req.user!.id,
      });
    }

    res.json(recordItem);
  } catch (err) {
    next(err);
  }
}

export async function listDrafts(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = req.user!.organizationId ?? (req.headers['x-organization-id'] as string);
    if (!orgId) {
      res.status(400).json({ error: 'Organization ID required', code: 'MISSING_ORG_ID' });
      return;
    }

    const drafts = await recordService.listDrafts(orgId, req.user!.id);
    res.json({ items: drafts });
  } catch (err) {
    next(err);
  }
}

export async function deleteDraft(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params as Record<string, string>;
    const deleted = await recordService.deleteDraft(id, req.user!.id);

    if (!deleted) {
      res.status(404).json({ error: 'Draft not found or not owned by user', code: 'NOT_FOUND' });
      return;
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
