import { Schema, model, Document, Types } from 'mongoose';

export interface IStarRating extends Document {
  employeeId: Types.ObjectId;
  month: number;
  year: number;
  stars: number;
  performanceId: Types.ObjectId;
  calculatedAt: Date;
}

const starRatingSchema = new Schema<IStarRating>(
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
    stars: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    performanceId: {
      type: Schema.Types.ObjectId,
      ref: 'Performance',
      required: true,
    },
    calculatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

starRatingSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });

export default model<IStarRating>('StarRating', starRatingSchema);
