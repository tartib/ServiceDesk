import { Schema, model, Document, Types } from 'mongoose';

export interface IKPIScore {
  kpiId: Types.ObjectId;
  value: number;
  weight: number;
}

export interface IPerformance extends Document {
  employeeId: Types.ObjectId;
  month: number;
  year: number;
  kpiScores: IKPIScore[];
  recordedBy: Types.ObjectId;
  recordedAt: Date;
  updatedAt: Date;
}

const kpiScoreSchema = new Schema<IKPIScore>(
  {
    kpiId: {
      type: Schema.Types.ObjectId,
      ref: 'KPI',
      required: true,
    },
    value: {
      type: Number,
      required: true,
    },
    weight: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const performanceSchema = new Schema<IPerformance>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },
    kpiScores: [kpiScoreSchema],
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recordedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

performanceSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });

export default model<IPerformance>('Performance', performanceSchema);
