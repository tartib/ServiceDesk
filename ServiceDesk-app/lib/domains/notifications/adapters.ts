/**
 * Notifications Domain — Normalization Adapters
 *
 * Normalizes backend notification objects into the canonical frontend Notification shape.
 * Handles both unified model (_id, isRead) and legacy PM model (_id, read).
 */

import { Notification } from '@/types';

interface RawNotification {
  _id?: string;
  id?: string;
  userId?: string | { _id?: string };
  type?: string;
  source?: string;
  level?: string;
  title?: string;
  titleAr?: string;
  message?: string;
  messageAr?: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
  projectId?: string;
  organizationId?: string;
  isRead?: boolean;
  read?: boolean; // legacy PM field
  readAt?: string;
  sentAt?: string;
  scheduledFor?: string;
  isEscalation?: boolean;
  escalatedFrom?: string;
  actionRequired?: boolean;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  timestamp?: string; // alias used by some legacy paths
}

/**
 * Normalize a single raw notification into the canonical Notification shape.
 */
export function normalizeNotification(raw: unknown): Notification {
  if (!raw || typeof raw !== 'object') {
    return {
      id: '',
      userId: '',
      type: 'system',
      level: 'info',
      title: '',
      message: '',
      isRead: false,
      sentAt: '',
      isEscalation: false,
      actionRequired: false,
      createdAt: '',
    };
  }

  const n = raw as RawNotification;

  return {
    id: n.id || n._id || '',
    userId: typeof n.userId === 'object' ? (n.userId?._id || '') : (n.userId || ''),
    type: (n.type as Notification['type']) || 'system',
    source: (n.source as Notification['source']) || undefined,
    level: (n.level as Notification['level']) || 'info',
    title: n.title || '',
    titleAr: n.titleAr,
    message: n.message || '',
    messageAr: n.messageAr,
    relatedEntityId: n.relatedEntityId,
    relatedEntityType: n.relatedEntityType,
    projectId: n.projectId,
    organizationId: n.organizationId,
    isRead: n.isRead ?? n.read ?? false,
    sentAt: n.sentAt || '',
    readAt: n.readAt,
    scheduledFor: n.scheduledFor,
    isEscalation: n.isEscalation ?? false,
    escalatedFrom: n.escalatedFrom,
    actionRequired: n.actionRequired ?? false,
    actionUrl: n.actionUrl,
    metadata: n.metadata as Record<string, any> | undefined,
    createdAt: n.createdAt || n.timestamp || '',
    updatedAt: n.updatedAt,
  };
}

/**
 * Normalize a list of raw notifications.
 */
export function normalizeNotificationList(raw: unknown): Notification[] {
  if (!raw) return [];
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeNotification);
}
