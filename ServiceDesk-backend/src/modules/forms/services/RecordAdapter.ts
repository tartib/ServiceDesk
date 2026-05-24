/**
 * RecordAdapter — Backward Compatibility Adapters
 *
 * Converts legacy domain entities (Incident, ServiceRequest, PM Task)
 * into the unified RecordItem shape for the RecordDetailPage.
 *
 * These are read-only projections — they do NOT create RecordItem documents.
 * Used by the unified detail page to render legacy items as records.
 */

import type { IRecordItem } from '../models/RecordItem';
import { RecordItemStatus, RecordSourceType, RecordPriority } from '../models/RecordItem';

// ── Incident adapter ────────────────────────────────────────────────────────

interface IncidentLike {
  _id: any;
  incident_id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  requester: { id: string; name: string; email: string; department?: string };
  assigned_to?: { technician_id: string; name: string };
  sla?: { response_due?: Date; resolution_due?: Date; breach_flag?: boolean };
  site_id?: string;
  created_at: Date;
  updated_at: Date;
}

export function incidentToRecordItem(
  incident: IncidentLike,
  organizationId: string,
): Omit<IRecordItem, 'recordNumber'> {
  return {
    title: incident.title,
    description: incident.description,
    status: mapIncidentStatus(incident.status),
    priority: mapPriority(incident.priority),
    requesterId: incident.requester.id,
    requesterName: incident.requester.name,
    requesterEmail: incident.requester.email,
    assigneeId: incident.assigned_to?.technician_id,
    assigneeName: incident.assigned_to?.name,
    sourceType: RecordSourceType.TICKET,
    sourceId: incident._id?.toString(),
    sla: incident.sla
      ? {
          dueAt: incident.sla.resolution_due,
          status: incident.sla.breach_flag ? 'breached' : 'on_track',
        }
      : undefined,
    organizationId,
    siteId: incident.site_id,
    createdAt: incident.created_at,
    updatedAt: incident.updated_at,
  };
}

// ── Service Request adapter ─────────────────────────────────────────────────

interface ServiceRequestLike {
  _id: any;
  request_id: string;
  service_name: string;
  status: string;
  priority: string;
  requester: { id: string; name: string; email: string; department?: string };
  assigned_to?: { technician_id: string; name: string };
  sla?: { response_due?: Date; resolution_due?: Date; breach_flag?: boolean };
  site_id?: string;
  created_at: Date;
  updated_at: Date;
}

export function serviceRequestToRecordItem(
  sr: ServiceRequestLike,
  organizationId: string,
): Omit<IRecordItem, 'recordNumber'> {
  return {
    title: sr.service_name,
    status: mapServiceRequestStatus(sr.status),
    priority: mapPriority(sr.priority),
    requesterId: sr.requester.id,
    requesterName: sr.requester.name,
    requesterEmail: sr.requester.email,
    assigneeId: sr.assigned_to?.technician_id,
    assigneeName: sr.assigned_to?.name,
    sourceType: RecordSourceType.TICKET,
    sourceId: sr._id?.toString(),
    sla: sr.sla
      ? {
          dueAt: sr.sla.resolution_due,
          status: sr.sla.breach_flag ? 'breached' : 'on_track',
        }
      : undefined,
    organizationId,
    siteId: sr.site_id,
    createdAt: sr.created_at,
    updatedAt: sr.updated_at,
  };
}

// ── PM Task adapter ──────────────────────────────────────────────────────────

interface TaskLike {
  _id: any;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assignees?: Array<{ userId: string; name?: string }>;
  createdBy: string;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export function taskToRecordItem(
  task: TaskLike,
): Omit<IRecordItem, 'recordNumber'> {
  const firstAssignee = task.assignees?.[0];
  return {
    title: task.title,
    description: task.description,
    status: mapTaskStatus(task.status),
    priority: mapPriority(task.priority),
    requesterId: task.createdBy,
    assigneeId: firstAssignee?.userId,
    assigneeName: firstAssignee?.name,
    sourceType: RecordSourceType.TASK,
    sourceId: task._id?.toString(),
    organizationId: task.organizationId,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

// ── Form Submission adapter ──────────────────────────────────────────────────

interface FormSubmissionLike {
  _id: any;
  submission_id?: string;
  form_template_id: string;
  workflow_state?: { status: string };
  submitted_by: { user_id: string; name: string; email?: string };
  site_id?: string;
  created_at: Date;
  updated_at: Date;
}

export function formSubmissionToRecordItem(
  sub: FormSubmissionLike,
  organizationId: string,
): Omit<IRecordItem, 'recordNumber'> {
  return {
    title: `Form ${sub.submission_id ?? sub._id?.toString()?.slice(-8)}`,
    status: mapSubmissionStatus(sub.workflow_state?.status ?? 'draft'),
    priority: RecordPriority.MEDIUM,
    requesterId: sub.submitted_by.user_id,
    requesterName: sub.submitted_by.name,
    requesterEmail: sub.submitted_by.email,
    formSubmissionId: sub._id?.toString(),
    sourceType: RecordSourceType.FORM_SUBMISSION,
    sourceId: sub._id?.toString(),
    organizationId,
    siteId: sub.site_id,
    createdAt: sub.created_at,
    updatedAt: sub.updated_at,
  };
}

// ── Status mappers ───────────────────────────────────────────────────────────

function mapIncidentStatus(status: string): RecordItemStatus {
  const map: Record<string, RecordItemStatus> = {
    new: RecordItemStatus.SUBMITTED,
    open: RecordItemStatus.IN_PROGRESS,
    in_progress: RecordItemStatus.IN_PROGRESS,
    pending: RecordItemStatus.WAITING_CLIENT,
    resolved: RecordItemStatus.COMPLETED,
    closed: RecordItemStatus.COMPLETED,
    cancelled: RecordItemStatus.CANCELLED,
  };
  return map[status] ?? RecordItemStatus.SUBMITTED;
}

function mapServiceRequestStatus(status: string): RecordItemStatus {
  const map: Record<string, RecordItemStatus> = {
    new: RecordItemStatus.SUBMITTED,
    open: RecordItemStatus.IN_PROGRESS,
    pending_approval: RecordItemStatus.UNDER_REVIEW,
    approved: RecordItemStatus.APPROVED,
    in_progress: RecordItemStatus.IN_PROGRESS,
    fulfilled: RecordItemStatus.COMPLETED,
    closed: RecordItemStatus.COMPLETED,
    cancelled: RecordItemStatus.CANCELLED,
    rejected: RecordItemStatus.REJECTED,
  };
  return map[status] ?? RecordItemStatus.SUBMITTED;
}

function mapTaskStatus(status: string): RecordItemStatus {
  const map: Record<string, RecordItemStatus> = {
    backlog: RecordItemStatus.DRAFT,
    todo: RecordItemStatus.SUBMITTED,
    in_progress: RecordItemStatus.IN_PROGRESS,
    in_review: RecordItemStatus.UNDER_REVIEW,
    done: RecordItemStatus.COMPLETED,
    cancelled: RecordItemStatus.CANCELLED,
  };
  return map[status] ?? RecordItemStatus.SUBMITTED;
}

function mapSubmissionStatus(status: string): RecordItemStatus {
  const map: Record<string, RecordItemStatus> = {
    draft: RecordItemStatus.DRAFT,
    submitted: RecordItemStatus.SUBMITTED,
    pending_approval: RecordItemStatus.UNDER_REVIEW,
    approved: RecordItemStatus.APPROVED,
    rejected: RecordItemStatus.REJECTED,
    in_progress: RecordItemStatus.IN_PROGRESS,
    on_hold: RecordItemStatus.WAITING_CLIENT,
    completed: RecordItemStatus.COMPLETED,
    cancelled: RecordItemStatus.CANCELLED,
  };
  return map[status] ?? RecordItemStatus.SUBMITTED;
}

function mapPriority(priority: string): RecordPriority {
  const map: Record<string, RecordPriority> = {
    low: RecordPriority.LOW,
    medium: RecordPriority.MEDIUM,
    high: RecordPriority.HIGH,
    critical: RecordPriority.CRITICAL,
    urgent: RecordPriority.CRITICAL,
    P1: RecordPriority.CRITICAL,
    P2: RecordPriority.HIGH,
    P3: RecordPriority.MEDIUM,
    P4: RecordPriority.LOW,
  };
  return map[priority] ?? RecordPriority.MEDIUM;
}
