import mongoose, { Schema } from 'mongoose';
import { MethodologyCode } from './Project';
import { PMStatusCategory } from './Task';

export interface IWorkflowStatus {
  id: string;
  name: string;
  category: PMStatusCategory;
  color: string;
  order: number;
  isInitial?: boolean;
  isFinal?: boolean;
}

export interface IWorkflowTransition {
  id: string;
  name: string;
  fromStatus: string;
  toStatus: string;
  conditions?: {
    requiredFields?: string[];
    requiredRole?: string[];
    requireComment?: boolean;
  };
}

export interface IPMWorkflow {
  _id: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  methodology: MethodologyCode;
  isDefault: boolean;
  statuses: IWorkflowStatus[];
  transitions: IWorkflowTransition[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const WorkflowSchema = new Schema<IPMWorkflow>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'PMOrganization',
      required: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'PMProject',
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      maxlength: 500,
    },
    methodology: {
      type: String,
      enum: Object.values(MethodologyCode),
      required: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    statuses: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        category: {
          type: String,
          enum: Object.values(PMStatusCategory),
          required: true,
        },
        color: { type: String, default: '#6B7280' },
        order: { type: Number, required: true },
        isInitial: { type: Boolean, default: false },
        isFinal: { type: Boolean, default: false },
      },
    ],
    transitions: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        fromStatus: { type: String, required: true },
        toStatus: { type: String, required: true },
        conditions: {
          requiredFields: [{ type: String }],
          requiredRole: [{ type: String }],
          requireComment: { type: Boolean },
        },
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.__v = undefined;
        return ret;
      },
    },
  }
);

WorkflowSchema.index({ organizationId: 1, methodology: 1 });
WorkflowSchema.index({ projectId: 1 });
WorkflowSchema.index({ isDefault: 1 });

const PMWorkflow = mongoose.model<IPMWorkflow>('PMWorkflow', WorkflowSchema);

export default PMWorkflow;

// Default workflows for each methodology
export const defaultWorkflows: Record<MethodologyCode, Omit<IPMWorkflow, '_id' | 'organizationId' | 'createdBy' | 'createdAt' | 'updatedAt'>> = {
  [MethodologyCode.SCRUM]: {
    name: 'Scrum Workflow',
    description: 'Standard Scrum workflow with backlog, sprint, and done states',
    methodology: MethodologyCode.SCRUM,
    isDefault: true,
    statuses: [
      { id: 'backlog', name: 'Backlog', category: PMStatusCategory.TODO, color: '#6B7280', order: 0, isInitial: true },
      { id: 'ready', name: 'Ready', category: PMStatusCategory.TODO, color: '#3B82F6', order: 1 },
      { id: 'in-progress', name: 'In Progress', category: PMStatusCategory.IN_PROGRESS, color: '#F59E0B', order: 2 },
      { id: 'in-review', name: 'In Review', category: PMStatusCategory.IN_PROGRESS, color: '#8B5CF6', order: 3 },
      { id: 'done', name: 'Done', category: PMStatusCategory.DONE, color: '#10B981', order: 4, isFinal: true },
    ],
    transitions: [
      { id: 't1', name: 'Ready for Sprint', fromStatus: 'backlog', toStatus: 'ready' },
      { id: 't2', name: 'Start Work', fromStatus: 'ready', toStatus: 'in-progress' },
      { id: 't3', name: 'Submit for Review', fromStatus: 'in-progress', toStatus: 'in-review' },
      { id: 't4', name: 'Request Changes', fromStatus: 'in-review', toStatus: 'in-progress' },
      { id: 't5', name: 'Approve', fromStatus: 'in-review', toStatus: 'done' },
      { id: 't6', name: 'Reopen', fromStatus: 'done', toStatus: 'in-progress' },
    ],
  },
  [MethodologyCode.KANBAN]: {
    name: 'Kanban Workflow',
    description: 'Continuous flow Kanban workflow',
    methodology: MethodologyCode.KANBAN,
    isDefault: true,
    statuses: [
      { id: 'todo', name: 'To Do', category: PMStatusCategory.TODO, color: '#6B7280', order: 0, isInitial: true },
      { id: 'in-progress', name: 'In Progress', category: PMStatusCategory.IN_PROGRESS, color: '#F59E0B', order: 1 },
      { id: 'review', name: 'Review', category: PMStatusCategory.IN_PROGRESS, color: '#8B5CF6', order: 2 },
      { id: 'done', name: 'Done', category: PMStatusCategory.DONE, color: '#10B981', order: 3, isFinal: true },
    ],
    transitions: [
      { id: 't1', name: 'Start', fromStatus: 'todo', toStatus: 'in-progress' },
      { id: 't2', name: 'Review', fromStatus: 'in-progress', toStatus: 'review' },
      { id: 't3', name: 'Rework', fromStatus: 'review', toStatus: 'in-progress' },
      { id: 't4', name: 'Complete', fromStatus: 'review', toStatus: 'done' },
      { id: 't5', name: 'Reopen', fromStatus: 'done', toStatus: 'todo' },
    ],
  },
  [MethodologyCode.WATERFALL]: {
    name: 'Waterfall Workflow',
    description: 'Sequential phase-based workflow',
    methodology: MethodologyCode.WATERFALL,
    isDefault: true,
    statuses: [
      { id: 'requirements', name: 'Requirements', category: PMStatusCategory.TODO, color: '#6B7280', order: 0, isInitial: true },
      { id: 'design', name: 'Design', category: PMStatusCategory.IN_PROGRESS, color: '#3B82F6', order: 1 },
      { id: 'implementation', name: 'Implementation', category: PMStatusCategory.IN_PROGRESS, color: '#F59E0B', order: 2 },
      { id: 'testing', name: 'Testing', category: PMStatusCategory.IN_PROGRESS, color: '#8B5CF6', order: 3 },
      { id: 'deployment', name: 'Deployment', category: PMStatusCategory.IN_PROGRESS, color: '#EC4899', order: 4 },
      { id: 'completed', name: 'Completed', category: PMStatusCategory.DONE, color: '#10B981', order: 5, isFinal: true },
    ],
    transitions: [
      { id: 't1', name: 'Approve Requirements', fromStatus: 'requirements', toStatus: 'design' },
      { id: 't2', name: 'Approve Design', fromStatus: 'design', toStatus: 'implementation' },
      { id: 't3', name: 'Ready for Testing', fromStatus: 'implementation', toStatus: 'testing' },
      { id: 't4', name: 'Ready for Deployment', fromStatus: 'testing', toStatus: 'deployment' },
      { id: 't5', name: 'Deploy', fromStatus: 'deployment', toStatus: 'completed' },
    ],
  },
  [MethodologyCode.ITIL]: {
    name: 'ITIL Change Workflow',
    description: 'ITIL change management workflow with CAB approval',
    methodology: MethodologyCode.ITIL,
    isDefault: true,
    statuses: [
      { id: 'draft', name: 'Draft', category: PMStatusCategory.TODO, color: '#6B7280', order: 0, isInitial: true },
      { id: 'submitted', name: 'Submitted', category: PMStatusCategory.TODO, color: '#3B82F6', order: 1 },
      { id: 'assessment', name: 'Assessment', category: PMStatusCategory.IN_PROGRESS, color: '#F59E0B', order: 2 },
      { id: 'cab-review', name: 'CAB Review', category: PMStatusCategory.IN_PROGRESS, color: '#8B5CF6', order: 3 },
      { id: 'approved', name: 'Approved', category: PMStatusCategory.IN_PROGRESS, color: '#10B981', order: 4 },
      { id: 'scheduled', name: 'Scheduled', category: PMStatusCategory.IN_PROGRESS, color: '#EC4899', order: 5 },
      { id: 'implementing', name: 'Implementing', category: PMStatusCategory.IN_PROGRESS, color: '#F97316', order: 6 },
      { id: 'review', name: 'Post-Implementation Review', category: PMStatusCategory.IN_PROGRESS, color: '#06B6D4', order: 7 },
      { id: 'closed', name: 'Closed', category: PMStatusCategory.DONE, color: '#10B981', order: 8, isFinal: true },
      { id: 'rejected', name: 'Rejected', category: PMStatusCategory.DONE, color: '#EF4444', order: 9, isFinal: true },
    ],
    transitions: [
      { id: 't1', name: 'Submit', fromStatus: 'draft', toStatus: 'submitted' },
      { id: 't2', name: 'Assess', fromStatus: 'submitted', toStatus: 'assessment' },
      { id: 't3', name: 'Send to CAB', fromStatus: 'assessment', toStatus: 'cab-review' },
      { id: 't4', name: 'Approve', fromStatus: 'cab-review', toStatus: 'approved' },
      { id: 't5', name: 'Reject', fromStatus: 'cab-review', toStatus: 'rejected' },
      { id: 't6', name: 'Schedule', fromStatus: 'approved', toStatus: 'scheduled' },
      { id: 't7', name: 'Start Implementation', fromStatus: 'scheduled', toStatus: 'implementing' },
      { id: 't8', name: 'Complete Implementation', fromStatus: 'implementing', toStatus: 'review' },
      { id: 't9', name: 'Close', fromStatus: 'review', toStatus: 'closed' },
    ],
  },
  [MethodologyCode.LEAN]: {
    name: 'Lean Workflow',
    description: 'Value stream focused workflow',
    methodology: MethodologyCode.LEAN,
    isDefault: true,
    statuses: [
      { id: 'idea', name: 'Idea', category: PMStatusCategory.TODO, color: '#6B7280', order: 0, isInitial: true },
      { id: 'validated', name: 'Validated', category: PMStatusCategory.TODO, color: '#3B82F6', order: 1 },
      { id: 'building', name: 'Building', category: PMStatusCategory.IN_PROGRESS, color: '#F59E0B', order: 2 },
      { id: 'measuring', name: 'Measuring', category: PMStatusCategory.IN_PROGRESS, color: '#8B5CF6', order: 3 },
      { id: 'learning', name: 'Learning', category: PMStatusCategory.IN_PROGRESS, color: '#EC4899', order: 4 },
      { id: 'done', name: 'Done', category: PMStatusCategory.DONE, color: '#10B981', order: 5, isFinal: true },
    ],
    transitions: [
      { id: 't1', name: 'Validate', fromStatus: 'idea', toStatus: 'validated' },
      { id: 't2', name: 'Build', fromStatus: 'validated', toStatus: 'building' },
      { id: 't3', name: 'Measure', fromStatus: 'building', toStatus: 'measuring' },
      { id: 't4', name: 'Learn', fromStatus: 'measuring', toStatus: 'learning' },
      { id: 't5', name: 'Complete', fromStatus: 'learning', toStatus: 'done' },
      { id: 't6', name: 'Iterate', fromStatus: 'learning', toStatus: 'building' },
    ],
  },
  [MethodologyCode.OKR]: {
    name: 'OKR Workflow',
    description: 'Objectives and Key Results tracking workflow',
    methodology: MethodologyCode.OKR,
    isDefault: true,
    statuses: [
      { id: 'draft', name: 'Draft', category: PMStatusCategory.TODO, color: '#6B7280', order: 0, isInitial: true },
      { id: 'committed', name: 'Committed', category: PMStatusCategory.TODO, color: '#3B82F6', order: 1 },
      { id: 'on-track', name: 'On Track', category: PMStatusCategory.IN_PROGRESS, color: '#10B981', order: 2 },
      { id: 'at-risk', name: 'At Risk', category: PMStatusCategory.IN_PROGRESS, color: '#F59E0B', order: 3 },
      { id: 'off-track', name: 'Off Track', category: PMStatusCategory.IN_PROGRESS, color: '#EF4444', order: 4 },
      { id: 'achieved', name: 'Achieved', category: PMStatusCategory.DONE, color: '#10B981', order: 5, isFinal: true },
      { id: 'missed', name: 'Missed', category: PMStatusCategory.DONE, color: '#EF4444', order: 6, isFinal: true },
    ],
    transitions: [
      { id: 't1', name: 'Commit', fromStatus: 'draft', toStatus: 'committed' },
      { id: 't2', name: 'Start Tracking', fromStatus: 'committed', toStatus: 'on-track' },
      { id: 't3', name: 'Flag Risk', fromStatus: 'on-track', toStatus: 'at-risk' },
      { id: 't4', name: 'Escalate', fromStatus: 'at-risk', toStatus: 'off-track' },
      { id: 't5', name: 'Recover', fromStatus: 'at-risk', toStatus: 'on-track' },
      { id: 't6', name: 'Achieve', fromStatus: 'on-track', toStatus: 'achieved' },
      { id: 't7', name: 'Miss', fromStatus: 'off-track', toStatus: 'missed' },
    ],
  },
};
