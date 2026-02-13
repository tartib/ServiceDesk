import mongoose, { Document, Schema } from 'mongoose';

export interface IWorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
  width?: number;
  height?: number;
}

export interface IWorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: string;
  animated?: boolean;
  label?: string;
  style?: Record<string, unknown>;
}

export interface IWorkflowDiagram extends Document {
  name: string;
  description?: string;
  nodes: IWorkflowNode[];
  edges: IWorkflowEdge[];
  status: 'draft' | 'published' | 'archived';
  createdBy: mongoose.Types.ObjectId;
  organizationId?: mongoose.Types.ObjectId;
  thumbnail?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const WorkflowNodeSchema = new Schema(
  {
    id: { type: String, required: true },
    type: { type: String, required: true },
    position: {
      x: { type: Number, required: true },
      y: { type: Number, required: true },
    },
    data: { type: Schema.Types.Mixed, default: {} },
    width: { type: Number },
    height: { type: Number },
  },
  { _id: false }
);

const WorkflowEdgeSchema = new Schema(
  {
    id: { type: String, required: true },
    source: { type: String, required: true },
    target: { type: String, required: true },
    sourceHandle: { type: String },
    targetHandle: { type: String },
    type: { type: String },
    animated: { type: Boolean, default: false },
    label: { type: String },
    style: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const WorkflowDiagramSchema = new Schema<IWorkflowDiagram>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    nodes: { type: [WorkflowNodeSchema], default: [] },
    edges: { type: [WorkflowEdgeSchema], default: [] },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization' },
    thumbnail: { type: String },
    tags: { type: [String], default: [] },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        const { __v, ...rest } = ret;
        return rest;
      },
    },
  }
);

WorkflowDiagramSchema.index({ createdBy: 1, status: 1 });
WorkflowDiagramSchema.index({ name: 'text', description: 'text', tags: 'text' });

export default mongoose.model<IWorkflowDiagram>('WorkflowDiagram', WorkflowDiagramSchema);
