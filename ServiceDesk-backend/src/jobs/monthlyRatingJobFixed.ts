import cron from 'node-cron';
import mongoose from 'mongoose';
import PerformanceModel from '../models/Performance';
import * as ratingService from '../services/ratingService';
import * as leaderboardService from '../services/leaderboardService';
import * as alertService from '../services/alertService';
import logger from '../utils/logger';

interface JobLock {
  jobName: string;
  month: number;
  year: number;
  status: 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  error?: string;
}

const JobLockSchema = new mongoose.Schema<JobLock>({
  jobName: { type: String, required: true },
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  status: { type: String, enum: ['running', 'completed', 'failed'], default: 'running' },
  startedAt: { type: Date, default: Date.now },
  completedAt: Date,
  error: String,
});

const JobLockModel = mongoose.model<JobLock>('JobLock', JobLockSchema);

export const startMonthlyRatingJob = () => {
  cron.schedule('0 0 1 * *', async () => {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const month = lastMonth.getMonth() + 1;
    const year = lastMonth.getFullYear();

    await executeJobWithRetry(month, year, 1);
  });
};

async function executeJobWithRetry(month: number, year: number, attempt: number): Promise<void> {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 5 * 60 * 1000;
  const jobName = 'MONTHLY_RATING_CALCULATION';

  try {
    const existingLock = await JobLockModel.findOne({ jobName, month, year });
    if (existingLock && existingLock.status === 'completed') {
      logger.info(`Job ${jobName} already completed for ${month}/${year}`);
      return;
    }

    const lock = await JobLockModel.findOneAndUpdate(
      { jobName, month, year },
      {
        jobName,
        month,
        year,
        startedAt: new Date(),
        status: 'running',
      },
      { upsert: true, new: true }
    );

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const performances = await PerformanceModel.find({ month, year }).session(session);

      for (const performance of performances) {
        const stars = await ratingService.calculateStarRating(performance._id.toString());
        await ratingService.saveStarRating(
          performance.employeeId.toString(),
          month,
          year,
          stars,
          performance._id.toString()
        );
      }

      await leaderboardService.generateLeaderboard(month, year);
      await alertService.createLowPerformanceAlerts(month, year);

      await session.commitTransaction();

      await JobLockModel.updateOne(
        { _id: lock._id },
        { status: 'completed', completedAt: new Date() }
      );

      logger.info(`Job ${jobName} completed successfully for ${month}/${year}`);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  } catch (error) {
    logger.error(`Job ${jobName} failed (attempt ${attempt}/${MAX_RETRIES}):`, error);

    if (attempt < MAX_RETRIES) {
      logger.warn(`Retrying in ${RETRY_DELAY / 1000 / 60} minutes...`);
      setTimeout(() => executeJobWithRetry(month, year, attempt + 1), RETRY_DELAY);
    } else {
      await JobLockModel.updateOne(
        { jobName, month, year },
        {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      );
      logger.error(`Job ${jobName} failed after ${MAX_RETRIES} attempts`);
    }
  }
}

export const runMonthlyRatingJobManually = async (month: number, year: number) => {
  await executeJobWithRetry(month, year, 1);
  return { success: true, message: `Ratings calculated for ${month}/${year}` };
};
