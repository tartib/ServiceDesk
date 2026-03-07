import mongoose, { Schema } from 'mongoose';
import {
  WFEntityType,
  WFEventType,
  WFActorType,
  type IWFEvent,
} from '../../../core/types/workflow-engine.types';

// ============================================
// MAIN SCHEMA
// ============================================

const WorkflowEventSchema = new Schema<IWFEvent>(
  {
    instanceId: {
      type: Schema.Types.ObjectId,
      ref: 'WorkflowInstance',
      required: true,
    },
    definitionId: {
      type: Schema.Types.ObjectId,
      ref: 'WorkflowDefinition',
      required: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'PMOrganization',
      required: true,
    },
    entityType: {
      type: String,
      enum: Object.values(WFEntityType),
      required: true,
    },
    entityId: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(WFEventType),
      required: true,
    },
    fromState: {
      type: String,
    },
    toState: {
      type: String,
    },
    transitionId: {
      type: String,
    },
    actorId: {
      type: String,
    },
    actorType: {
      type: String,
      enum: Object.values(WFActorType),
      required: true,
    },
    actorName: {
      type: String,
    },
    data: {
      type: Schema.Types.Mixed,
    },
    error: {
      type: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: false,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.__v = undefined;
        return ret;
      },
    },
  }
);

// ============================================
// INDEXES
// ============================================

WorkflowEventSchema.index({ instanceId: 1, timestamp: -1 });
WorkflowEventSchema.index({ definitionId: 1, timestamp: -1 });
WorkflowEventSchema.index({ organizationId: 1, timestamp: -1 });
WorkflowEventSchema.index({ entityType: 1, entityId: 1, timestamp: -1 });
WorkflowEventSchema.index({ type: 1, timestamp: -1 });
WorkflowEventSchema.index({ actorId: 1, timestamp: -1 });
WorkflowEventSchema.index({ instanceId: 1, type: 1 });

// TTL index — auto-delete events older than 1 year (optional, configurable)
// WorkflowEventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

// ============================================
// EXPORT
// ============================================

const WorkflowEvent = mongoose.model<IWFEvent>('WorkflowEvent', WorkflowEventSchema);

export default WorkflowEvent;
