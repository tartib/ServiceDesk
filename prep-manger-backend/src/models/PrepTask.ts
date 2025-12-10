import mongoose, { Document, Schema } from 'mongoose';
import { TaskStatus, TaskType, TaskPriority, AssignmentType } from '../types';

export interface IPrepTask extends Document {
  productId: mongoose.Types.ObjectId;
  productName: string;
  assignedTo?: mongoose.Types.ObjectId;
  assignedToName?: string;
  assignmentType: AssignmentType;
  status: TaskStatus;
  taskType: TaskType;
  priority: TaskPriority;
  scheduledAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  dueAt: Date;
  prepTimeMinutes: number;
  preparedQuantity?: number;
  usedQuantity?: number;
  unit?: string;
  notes?: string;
  isRecurring: boolean;
  recurringPattern?: string;
  estimatedDuration: number; // بالدقائق
  actualDuration?: number; // بالدقائق
  isOverdue: boolean;
  isEscalated: boolean;
  escalatedAt?: Date;
  escalatedTo?: mongoose.Types.ObjectId;
  completionScore?: number; // تقييم الإنجاز من 1-5
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const prepTaskSchema = new Schema<IPrepTask>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    productName: {
      type: String,
      required: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    assignedToName: {
      type: String,
    },
    assignmentType: {
      type: String,
      enum: Object.values(AssignmentType),
      default: AssignmentType.SPECIFIC_USER,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(TaskStatus),
      default: TaskStatus.SCHEDULED,
      required: true,
      index: true,
    },
    taskType: {
      type: String,
      enum: Object.values(TaskType),
      required: true,
      index: true,
    },
    priority: {
      type: String,
      enum: Object.values(TaskPriority),
      default: TaskPriority.MEDIUM,
      required: true,
      index: true,
    },
    scheduledAt: {
      type: Date,
      required: true,
      index: true,
    },
    dueAt: {
      type: Date,
      required: true,
      index: true,
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    prepTimeMinutes: {
      type: Number,
      required: true,
      min: 1,
    },
    estimatedDuration: {
      type: Number,
      required: true,
      min: 1,
    },
    actualDuration: {
      type: Number,
      min: 0,
    },
    preparedQuantity: {
      type: Number,
      min: 0,
    },
    usedQuantity: {
      type: Number,
      min: 0,
    },
    unit: {
      type: String,
      enum: ['kg', 'g', 'l', 'ml', 'pcs', 'cup', 'tbsp', 'tsp', 'serving'],
    },
    notes: {
      type: String,
      maxlength: 1000,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringPattern: {
      type: String,
    },
    isOverdue: {
      type: Boolean,
      default: false,
      index: true,
    },
    isEscalated: {
      type: Boolean,
      default: false,
      index: true,
    },
    escalatedAt: {
      type: Date,
    },
    escalatedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    completionScore: {
      type: Number,
      min: 1,
      max: 5,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
prepTaskSchema.index({ scheduledAt: 1, status: 1 });
prepTaskSchema.index({ productId: 1, status: 1, createdAt: -1 });
prepTaskSchema.index({ assignedTo: 1, status: 1 });
prepTaskSchema.index({ taskType: 1, priority: 1, dueAt: 1 });
prepTaskSchema.index({ isOverdue: 1, isEscalated: 1 });
prepTaskSchema.index({ dueAt: 1, status: 1 });
prepTaskSchema.index({ priority: 1, status: 1, dueAt: 1 });

// Virtual field for waste calculation
prepTaskSchema.virtual('waste').get(function () {
  if (this.preparedQuantity && this.usedQuantity) {
    return this.preparedQuantity - this.usedQuantity;
  }
  return 0;
});

// Virtual field for performance score
prepTaskSchema.virtual('performanceScore').get(function () {
  if (!this.actualDuration || !this.estimatedDuration) return null;
  
  const ratio = this.actualDuration / this.estimatedDuration;
  if (ratio <= 1) return 100;
  if (ratio <= 1.2) return 80;
  if (ratio <= 1.5) return 60;
  return 40;
});

// Virtual field for time remaining
prepTaskSchema.virtual('timeRemaining').get(function () {
  if (this.status === TaskStatus.COMPLETED || !this.dueAt) return 0;
  const now = new Date();
  const diff = this.dueAt.getTime() - now.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60))); // بالدقائق
});

// Include virtuals in JSON
prepTaskSchema.set('toJSON', { virtuals: true });
prepTaskSchema.set('toObject', { virtuals: true });

const PrepTask = mongoose.model<IPrepTask>('PrepTask', prepTaskSchema);

export default PrepTask;
