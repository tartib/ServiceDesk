import mongoose, { Document, Schema } from 'mongoose';
import { NotificationType, NotificationLevel, TaskPriority } from '../types';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  level: NotificationLevel;
  priority: TaskPriority;
  title: string;
  message: string;
  relatedTaskId?: mongoose.Types.ObjectId;
  relatedInventoryId?: mongoose.Types.ObjectId;
  isRead: boolean;
  sentAt: Date;
  readAt?: Date;
  scheduledFor?: Date;
  isEscalation: boolean;
  escalatedFrom?: mongoose.Types.ObjectId;
  actionRequired: boolean;
  actionUrl?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
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
    level: {
      type: String,
      enum: Object.values(NotificationLevel),
      default: NotificationLevel.INFO,
      required: true,
    },
    priority: {
      type: String,
      enum: Object.values(TaskPriority),
      default: TaskPriority.MEDIUM,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 150,
    },
    message: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    relatedTaskId: {
      type: Schema.Types.ObjectId,
      ref: 'PrepTask',
      index: true,
    },
    relatedInventoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Inventory',
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    readAt: {
      type: Date,
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
  }
);

// Compound indexes for efficient queries
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, priority: 1, isRead: 1 });
notificationSchema.index({ level: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ isEscalation: 1, userId: 1, isRead: 1 });

const Notification = mongoose.model<INotification>('Notification', notificationSchema);

export default Notification;
