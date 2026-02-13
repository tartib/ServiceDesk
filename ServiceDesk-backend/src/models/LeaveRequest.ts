import mongoose, { Document, Schema } from 'mongoose';

export type LeaveType = 'vacation' | 'wfh' | 'sick' | 'holiday' | 'blackout';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface ILeaveRequest extends Document {
  userId: mongoose.Types.ObjectId;
  teamId: mongoose.Types.ObjectId;
  type: LeaveType;
  startDate: Date;
  endDate: Date;
  reason?: string;
  status: LeaveStatus;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  reviewNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LeaveRequestSchema = new Schema<ILeaveRequest>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    type: {
      type: String,
      enum: ['vacation', 'wfh', 'sick', 'holiday', 'blackout'],
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String, trim: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    reviewNote: { type: String, trim: true },
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

LeaveRequestSchema.index({ teamId: 1, startDate: 1, endDate: 1 });
LeaveRequestSchema.index({ userId: 1, status: 1 });
LeaveRequestSchema.index({ teamId: 1, type: 1 });

export default mongoose.model<ILeaveRequest>('LeaveRequest', LeaveRequestSchema);
