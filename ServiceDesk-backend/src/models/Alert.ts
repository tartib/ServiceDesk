import { Schema, model, Document, Types } from 'mongoose';

export interface IAlert extends Document {
  employeeId: Types.ObjectId;
  type: 'low_performance' | 'achievement';
  message: string;
  stars: number;
  acknowledged: boolean;
  createdAt: Date;
  acknowledgedAt?: Date;
}

const alertSchema = new Schema<IAlert>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    type: {
      type: String,
      enum: ['low_performance', 'achievement'],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    stars: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    acknowledged: {
      type: Boolean,
      default: false,
    },
    acknowledgedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

alertSchema.index({ employeeId: 1, createdAt: -1 });

export default model<IAlert>('Alert', alertSchema);
