import { Schema, model, Document, Types } from 'mongoose';
import { GrowthState } from '../domain';

export interface IGrowthStateConfigDoc extends Document {
  state: GrowthState;
  minPoints: number;
  minLevel: number;
  icon: string;
  label: string;
  labelAr?: string;
  organizationId?: Types.ObjectId;
}

const growthStateConfigSchema = new Schema<IGrowthStateConfigDoc>(
  {
    state: { type: String, enum: Object.values(GrowthState), required: true },
    minPoints: { type: Number, required: true },
    minLevel: { type: Number, required: true },
    icon: { type: String, required: true },
    label: { type: String, required: true },
    labelAr: { type: String },
    organizationId: { type: Schema.Types.ObjectId },
  },
  { timestamps: true }
);

growthStateConfigSchema.index({ organizationId: 1 });
growthStateConfigSchema.index({ state: 1, organizationId: 1 });

export default model<IGrowthStateConfigDoc>('GrowthStateConfig', growthStateConfigSchema);
