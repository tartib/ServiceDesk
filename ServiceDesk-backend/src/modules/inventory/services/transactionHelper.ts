import mongoose, { ClientSession } from 'mongoose';
import logger from '../../../utils/logger';

/**
 * Attempts to run a callback within a Mongo transaction (requires replica set).
 * If the environment doesn't support transactions (standalone), runs without a session.
 */
export async function withOptionalTransaction<T>(
  fn: (session: ClientSession | undefined) => Promise<T>,
): Promise<T> {
  let session: ClientSession | undefined;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
    const result = await fn(session);
    await session.commitTransaction();
    return result;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    // Detect standalone topology errors (no replica set)
    if (
      msg.includes('Transaction numbers') ||
      msg.includes('not supported') ||
      msg.includes('no replica set') ||
      msg.includes('does not support retryable writes') ||
      msg.includes('Transaction')  && msg.includes('topology')
    ) {
      logger.warn('Transactions not supported — running without session');
      if (session) {
        try { await session.abortTransaction(); } catch { /* ignore */ }
        await session.endSession();
        session = undefined;
      }
      return fn(undefined);
    }
    // Real error — abort and re-throw
    if (session) {
      try { await session.abortTransaction(); } catch { /* ignore */ }
    }
    throw err;
  } finally {
    if (session) {
      await session.endSession();
    }
  }
}
