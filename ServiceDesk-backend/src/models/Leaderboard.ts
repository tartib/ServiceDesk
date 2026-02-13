import { Schema, model, Document, Types } from 'mongoose';

export interface IRanking {
  rank: number;
  employeeId: Types.ObjectId;
  stars: number;
  department: string;
}

export interface ILeaderboard extends Document {
  month: number;
  year: number;
  rankings: IRanking[];
  generatedAt: Date;
}

const rankingSchema = new Schema<IRanking>(
  {
    rank: {
      type: Number,
      required: true,
    },
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    stars: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    department: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const leaderboardSchema = new Schema<ILeaderboard>(
  {
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
    rankings: [rankingSchema],
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

leaderboardSchema.index({ month: 1, year: 1 }, { unique: true });

export default model<ILeaderboard>('Leaderboard', leaderboardSchema);
