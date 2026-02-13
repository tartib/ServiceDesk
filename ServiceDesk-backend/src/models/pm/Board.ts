import mongoose, { Schema } from 'mongoose';
import { MethodologyCode } from './Project';

export interface IBoardColumn {
  id: string;
  name: string;
  statusId: string;
  wipLimit?: number;
  order: number;
}

export interface IBoardSwimlane {
  id: string;
  name: string;
  query?: string;
  order: number;
}

export interface IPMBoard {
  _id: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  name: string;
  type: 'scrum' | 'kanban' | 'custom';
  methodology: MethodologyCode;
  columns: IBoardColumn[];
  swimlanes: IBoardSwimlane[];
  settings: {
    showSubtasks: boolean;
    showEpics: boolean;
    cardFields: string[];
    quickFilters: {
      id: string;
      name: string;
      query: string;
    }[];
  };
  isDefault: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BoardSchema = new Schema<IPMBoard>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'PMProject',
      required: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'PMOrganization',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    type: {
      type: String,
      enum: ['scrum', 'kanban', 'custom'],
      required: true,
    },
    methodology: {
      type: String,
      enum: Object.values(MethodologyCode),
      required: true,
    },
    columns: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        statusId: { type: String, required: true },
        wipLimit: { type: Number },
        order: { type: Number, required: true },
      },
    ],
    swimlanes: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        query: { type: String },
        order: { type: Number, required: true },
      },
    ],
    settings: {
      showSubtasks: { type: Boolean, default: true },
      showEpics: { type: Boolean, default: true },
      cardFields: [{ type: String }],
      quickFilters: [
        {
          id: { type: String },
          name: { type: String },
          query: { type: String },
        },
      ],
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
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

BoardSchema.index({ projectId: 1 });
BoardSchema.index({ organizationId: 1 });
BoardSchema.index({ projectId: 1, isDefault: 1 });

const PMBoard = mongoose.model<IPMBoard>('PMBoard', BoardSchema);

export default PMBoard;
