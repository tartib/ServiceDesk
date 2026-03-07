/**
 * Unified Notification Model
 *
 * Merges the legacy OPS Notification schema (src/models/Notification.ts)
 * and the PM Notification schema (modules/pm/models/Notification.ts)
 * into a single collection with a `source` discriminator.
 */

import mongoose, { Document, Schema } from 'mongoose';
import {
  NotificationSource,
  NotificationChannel,
  NotificationLevel,
  NotificationType,
} from '../domain/interfaces';

export interface IUnifiedNotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  source: NotificationSource;
  level: NotificationLevel;
  channel: NotificationChannel;
  title: string;
  titleAr?: string;
  message: string;
  messageAr?: string;
  /** Polymorphic reference: task, incident, request, CI, etc. */
  relatedEntityId?: mongoose.Types.ObjectId;
  relatedEntityType?: string;
  /** PM-specific: scoped to a project */
  projectId?: mongoose.Types.ObjectId;
  organizationId?: mongoose.Types.ObjectId;
  isRead: boolean;
  readAt?: Date;
  sentAt: Date;
  scheduledFor?: Date;
  isEscalation: boolean;
  escalatedFrom?: mongoose.Types.ObjectId;
  actionRequired: boolean;
  actionUrl?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const unifiedNotificationSchema = new Schema<IUnifiedNotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true,
      index: true,
    },
    source: {
      type: String,
      enum: Object.values(NotificationSource),
      required: true,
      index: true,
    },
    level: {
      type: String,
      enum: Object.values(NotificationLevel),
      default: NotificationLevel.INFO,
      required: true,
    },
    channel: {
      type: String,
      enum: Object.values(NotificationChannel),
      default: NotificationChannel.IN_APP,
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    titleAr: {
      type: String,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    messageAr: {
      type: String,
      maxlength: 2000,
    },
    relatedEntityId: {
      type: Schema.Types.ObjectId,
      index: true,
    },
    relatedEntityType: {
      type: String,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'PMProject',
      index: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      index: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    scheduledFor: {
      type: Date,
    },
    isEscalation: {
      type: Boolean,
      default: false,
      index: true,
    },
    escalatedFrom: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    actionRequired: {
      type: Boolean,
      default: false,
      index: true,
    },
    actionUrl: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    collection: 'unified_notifications',
  }
);

// Compound indexes for efficient queries
unifiedNotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
unifiedNotificationSchema.index({ userId: 1, source: 1, isRead: 1, createdAt: -1 });
unifiedNotificationSchema.index({ userId: 1, projectId: 1, isRead: 1, createdAt: -1 });
unifiedNotificationSchema.index({ level: 1, isRead: 1, createdAt: -1 });
unifiedNotificationSchema.index({ isEscalation: 1, userId: 1, isRead: 1 });
unifiedNotificationSchema.index({ organizationId: 1, source: 1, createdAt: -1 });

const UnifiedNotification = mongoose.model<IUnifiedNotification>(
  'UnifiedNotification',
  unifiedNotificationSchema
);

export default UnifiedNotification;
