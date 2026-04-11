import { Schema, model, Document, Types } from 'mongoose';

export interface IUserAchievementDoc extends Document {
  userId: Types.ObjectId;
  organizationId: Types.ObjectId;
  achievementCode: string;
  unlockedAt: Date;
  progress?: number;
  notified: boolean;
}

const userAchievementSchema = new Schema<IUserAchievementDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    organizationId: { type: Schema.Types.ObjectId, required: true },
    achievementCode: { type: String, required: true },
    unlockedAt: { type: Date, required: true },
    progress: { type: Number },
    notified: { type: Boolean, default: false },
  },
  { timestamps: false }
);

// Prevent duplicate unlocks for non-repeatable achievements
userAchievementSchema.index({ userId: 1, achievementCode: 1, organizationId: 1 }, { unique: true });
userAchievementSchema.index({ userId: 1, organizationId: 1 });

export default model<IUserAchievementDoc>('UserAchievement', userAchievementSchema);
