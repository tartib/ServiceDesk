import { Schema, model, Document, Types } from 'mongoose';

export interface IStreakReminderLogDoc extends Document {
  userId: Types.ObjectId;
  date: string; // YYYY-MM-DD
  sent: boolean;
}

const streakReminderLogSchema = new Schema<IStreakReminderLogDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true },
    sent: { type: Boolean, default: false },
  },
  { timestamps: false }
);

streakReminderLogSchema.index({ userId: 1, date: 1 }, { unique: true });

export default model<IStreakReminderLogDoc>('StreakReminderLog', streakReminderLogSchema);
