import mongoose, { Schema, Model } from 'mongoose';

/**
 * Counter model for generating sequential IDs
 * Used for: INC-2025-00001, PRB-2025-00001, CHG-2025-00001, etc.
 */
export interface ICounter {
  _id: string;
  sequence: number;
  year: number;
}

interface ICounterMethods {}

interface CounterModel extends Model<ICounter, Record<string, never>, ICounterMethods> {
  getNextSequence(counterId: string): Promise<{ sequence: number; year: number }>;
  generateId(prefix: 'INC' | 'PRB' | 'CHG' | 'REL' | 'SRQ' | 'SRV' | 'SLA' | 'SITE' | 'CAT' | 'USR'): Promise<string>;
}

const CounterSchema = new Schema<ICounter, CounterModel, ICounterMethods>({
  _id: { type: String, required: true },
  sequence: { type: Number, default: 0 },
  year: { type: Number, required: true },
});

/**
 * Get next sequence number for a given counter
 * Resets sequence when year changes
 */
CounterSchema.statics.getNextSequence = async function (
  counterId: string
): Promise<{ sequence: number; year: number }> {
  const currentYear = new Date().getFullYear();

  const counter = await this.findOneAndUpdate(
    { _id: counterId },
    {
      $inc: { sequence: 1 },
      $setOnInsert: { year: currentYear },
    },
    { new: true, upsert: true }
  );

  if (!counter) {
    throw new Error('Failed to get counter');
  }

  // Reset sequence if year changed
  if (counter.year !== currentYear) {
    const resetCounter = await this.findOneAndUpdate(
      { _id: counterId },
      { sequence: 1, year: currentYear },
      { new: true }
    );
    if (!resetCounter) {
      throw new Error('Failed to reset counter');
    }
    return { sequence: resetCounter.sequence, year: currentYear };
  }

  return { sequence: counter.sequence, year: counter.year };
};

/**
 * Generate formatted ID
 * @param prefix - INC, PRB, CHG, REL, SRQ
 */
CounterSchema.statics.generateId = async function (
  prefix: 'INC' | 'PRB' | 'CHG' | 'REL' | 'SRQ' | 'SRV' | 'SLA' | 'SITE' | 'CAT' | 'USR'
): Promise<string> {
  const { sequence, year } = await this.getNextSequence(prefix);
  return `${prefix}-${year}-${String(sequence).padStart(5, '0')}`;
};

const Counter = mongoose.model<ICounter, CounterModel>('Counter', CounterSchema);

export default Counter;
