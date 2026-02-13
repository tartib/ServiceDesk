import { Schema, model, Document } from 'mongoose';

export interface IKPI extends Document {
  name: string;
  description: string;
  unit: string;
  weight: number;
  targetValue: number;
  minValue: number;
  maxValue: number;
  department?: string;
  createdAt: Date;
  updatedAt: Date;
}

const kpiSchema = new Schema<IKPI>(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    unit: {
      type: String,
      required: true,
    },
    weight: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    targetValue: {
      type: Number,
      required: true,
    },
    minValue: {
      type: Number,
      required: true,
    },
    maxValue: {
      type: Number,
      required: true,
    },
    department: {
      type: String,
    },
  },
  { timestamps: true }
);

export default model<IKPI>('KPI', kpiSchema);
