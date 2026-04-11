import { Schema, model, Document, Types } from 'mongoose';
import { AchievementCategory } from '../domain';

export interface IAchievementConditionDoc {
  type: string;
  operator: string;
  value: number;
  customField?: string;
}

export interface IAchievementDefinitionDoc extends Document {
  code: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  category: AchievementCategory;
  conditions: IAchievementConditionDoc[];
  icon: string;
  hidden: boolean;
  repeatable: boolean;
  organizationId?: Types.ObjectId;
}

const achievementConditionSchema = new Schema<IAchievementConditionDoc>(
  {
    type: {
      type: String,
      required: true,
      enum: ['total_points', 'current_level', 'current_streak', 'tasks_completed', 'sprints_completed', 'custom'],
    },
    operator: { type: String, required: true, enum: ['gte', 'eq', 'lte'] },
    value: { type: Number, required: true },
    customField: { type: String },
  },
  { _id: false }
);

const achievementDefinitionSchema = new Schema<IAchievementDefinitionDoc>(
  {
    code: { type: String, required: true },
    name: { type: String, required: true },
    nameAr: { type: String },
    description: { type: String },
    descriptionAr: { type: String },
    category: { type: String, enum: Object.values(AchievementCategory), required: true },
    conditions: [achievementConditionSchema],
    icon: { type: String, required: true },
    hidden: { type: Boolean, default: false },
    repeatable: { type: Boolean, default: false },
    organizationId: { type: Schema.Types.ObjectId },
  },
  { timestamps: true }
);

achievementDefinitionSchema.index({ code: 1, organizationId: 1 }, { unique: true });

export default model<IAchievementDefinitionDoc>('AchievementDefinition', achievementDefinitionSchema);
