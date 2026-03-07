import mongoose, { Schema } from 'mongoose';

export type PMActivityType = 
  | 'task_created' | 'task_updated' | 'task_deleted' | 'task_moved'
  | 'status_changed' | 'assignee_changed' | 'priority_changed'
  | 'comment_added' | 'comment_updated' | 'comment_deleted'
  | 'sprint_created' | 'sprint_started' | 'sprint_completed'
  | 'project_created' | 'project_updated'
  | 'member_added' | 'member_removed';

export interface IPMActivity {
  _id: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId;
  taskId?: mongoose.Types.ObjectId;
  sprintId?: mongoose.Types.ObjectId;
  type: PMActivityType;
  actor: mongoose.Types.ObjectId;
  description: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

const ActivitySchema = new Schema<IPMActivity>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'PMOrganization', required: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'PMProject' },
    taskId: { type: Schema.Types.ObjectId, ref: 'PMTask' },
    sprintId: { type: Schema.Types.ObjectId, ref: 'PMSprint' },
    type: { type: String, required: true },
    actor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    description: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.__v = undefined;
        return ret;
      },
    },
  }
);

ActivitySchema.index({ organizationId: 1, createdAt: -1 });
ActivitySchema.index({ projectId: 1, createdAt: -1 });
ActivitySchema.index({ taskId: 1 });
ActivitySchema.index({ actor: 1 });

const PMActivity = mongoose.model<IPMActivity>('PMActivity', ActivitySchema);

export default PMActivity;
