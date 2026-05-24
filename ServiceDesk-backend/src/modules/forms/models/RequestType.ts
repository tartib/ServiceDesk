/**
 * RequestType Model — Platform Core
 *
 * A RequestType links a workspace type to a form schema (FormTemplate)
 * and an optional workflow template (WorkflowDefinition).
 * It is the catalog entry that drives the CreateRequestFlow UI.
 */

import mongoose, { Schema, Document } from 'mongoose';
import { WorkspaceType } from '../../../shared/types/workspace.types';

export enum RequestTypePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface IRequestType {
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  icon?: string;
  workspaceType?: WorkspaceType;
  formSchemaId?: string;
  workflowTemplateId?: string;
  defaultPriority: RequestTypePriority;
  isClientVisible: boolean;
  isActive: boolean;
  category?: string;
  categoryAr?: string;
  sortOrder: number;
  organizationId: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRequestTypeDocument extends IRequestType, Document {}

const RequestTypeSchema = new Schema<IRequestTypeDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    nameAr: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      maxlength: 2000,
    },
    descriptionAr: {
      type: String,
      maxlength: 2000,
    },
    icon: {
      type: String,
      maxlength: 100,
    },
    workspaceType: {
      type: String,
      enum: Object.values(WorkspaceType),
    },
    formSchemaId: {
      type: String,
      ref: 'FormTemplate',
    },
    workflowTemplateId: {
      type: String,
      ref: 'WorkflowDefinition',
    },
    defaultPriority: {
      type: String,
      enum: Object.values(RequestTypePriority),
      default: RequestTypePriority.MEDIUM,
    },
    isClientVisible: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    category: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    categoryAr: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    organizationId: {
      type: String,
      required: true,
      index: true,
    },
    createdBy: {
      type: String,
      required: true,
    },
    updatedBy: {
      type: String,
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
  },
);

RequestTypeSchema.index({ organizationId: 1, isActive: 1, workspaceType: 1 });
RequestTypeSchema.index({ organizationId: 1, name: 1 }, { unique: true });
RequestTypeSchema.index({ organizationId: 1, sortOrder: 1 });

const RequestType = mongoose.model<IRequestTypeDocument>('RequestType', RequestTypeSchema);

export default RequestType;
