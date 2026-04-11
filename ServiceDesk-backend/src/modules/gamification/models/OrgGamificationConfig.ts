import { Schema, model, Document, Types } from 'mongoose';

export interface IOrgGamificationConfigDoc extends Document {
  organizationId: Types.ObjectId;
  pointsEnabled: boolean;
  streaksEnabled: boolean;
  leaderboardEnabled: boolean;
  achievementsEnabled: boolean;
  celebrationsEnabled: boolean;
  dailyPointsCap: number;
  streakMinDailyActivity: number;
  streakCutoffHour: number;
  timezone: string;
}

const orgGamificationConfigSchema = new Schema<IOrgGamificationConfigDoc>(
  {
    organizationId: { type: Schema.Types.ObjectId, required: true },
    pointsEnabled: { type: Boolean, default: true },
    streaksEnabled: { type: Boolean, default: true },
    leaderboardEnabled: { type: Boolean, default: true },
    achievementsEnabled: { type: Boolean, default: true },
    celebrationsEnabled: { type: Boolean, default: true },
    dailyPointsCap: { type: Number, default: 500 },
    streakMinDailyActivity: { type: Number, default: 1 },
    streakCutoffHour: { type: Number, default: 0 },
    timezone: { type: String, default: 'Asia/Riyadh' },
  },
  { timestamps: true }
);

orgGamificationConfigSchema.index({ organizationId: 1 }, { unique: true });

export default model<IOrgGamificationConfigDoc>('OrgGamificationConfig', orgGamificationConfigSchema);
