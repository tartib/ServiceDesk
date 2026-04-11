import { Schema, model, Document, Types } from 'mongoose';
import { GrowthState } from '../domain';

export interface IGamificationProfileDoc extends Document {
  userId: Types.ObjectId;
  organizationId: Types.ObjectId;
  totalPoints: number;
  currentLevel: number;
  growthState: GrowthState;
  currentStreak: number;
  longestStreak: number;
  lastQualifiedActivityAt?: Date;
  dailyPointsEarned: number;
  dailyPointsDate?: string;
  achievementCount: number;
}

const gamificationProfileSchema = new Schema<IGamificationProfileDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    organizationId: { type: Schema.Types.ObjectId, required: true },
    totalPoints: { type: Number, default: 0 },
    currentLevel: { type: Number, default: 0 },
    growthState: {
      type: String,
      enum: Object.values(GrowthState),
      default: GrowthState.SEED,
    },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastQualifiedActivityAt: { type: Date },
    dailyPointsEarned: { type: Number, default: 0 },
    dailyPointsDate: { type: String },
    achievementCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

gamificationProfileSchema.index({ userId: 1, organizationId: 1 }, { unique: true });
gamificationProfileSchema.index({ organizationId: 1, totalPoints: -1 });

export default model<IGamificationProfileDoc>('GamificationProfile', gamificationProfileSchema);
