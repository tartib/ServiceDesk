import cron from 'node-cron';
import PrepTask from '../models/PrepTask';
import Inventory from '../models/Inventory';
import { TaskStatus, NotificationType } from '../types';
import logger from '../utils/logger';
import { createNotification } from '../services/notificationService';

// Job 1: Auto-generate prep tasks every 15 minutes
export const autoGenerateTasksJob = cron.schedule('*/15 * * * *', async () => {
  try {
    logger.info('Running auto-generate tasks job...');
    
  
  } catch (error) {
    logger.error('Error in auto-generate tasks job:', error);
  }
});

// Job 2: Check for late tasks every 5 minutes
export const checkLateTasksJob = cron.schedule('*/5 * * * *', async () => {
  try {
    logger.info('Running late tasks check...');
    
    const now = new Date();
    
    const scheduledTasks = await PrepTask.find({
      status: TaskStatus.SCHEDULED,
    }).populate('assignedTo');

    for (const task of scheduledTasks) {
      const scheduledTime = new Date(task.scheduledAt);
      const expectedCompletionTime = new Date(
        scheduledTime.getTime() + task.prepTimeMinutes * 60 * 1000
      );

      if (now > expectedCompletionTime) {
        task.status = TaskStatus.LATE;
        await task.save();

        // Send notification if assigned
        if (task.assignedTo) {
          await createNotification({
            userId: task.assignedTo as any,
            type: NotificationType.LATE,
            title: 'Late Task Alert',
            message: `Task "${task.productName}" is overdue`,
            relatedTaskId: task._id.toString(),
          });
        }

        logger.warn(`Task marked as late: ${task.productName} (ID: ${task._id})`);
      }
    }
  } catch (error) {
    logger.error('Error in late tasks job:', error);
  }
});

// Job 3: Check inventory alerts every hour
export const inventoryAlertsJob = cron.schedule('0 * * * *', async () => {
  try {
    logger.info('Running inventory alerts check...');
    
    const lowStockItems = await Inventory.find({
      $or: [
        { $expr: { $lte: ['$currentQuantity', '$minThreshold'] } },
        { status: 'low_stock' },
        { status: 'out_of_stock' },
      ],
    });

    for (const item of lowStockItems) {
      logger.warn(`Low stock alert: ${item.name} - ${item.currentQuantity}${item.unit}`);
      
      // TODO: Send notifications to managers
    }
  } catch (error) {
    logger.error('Error in inventory alerts job:', error);
  }
});

// Start all jobs
export const startAllJobs = () => {
  autoGenerateTasksJob.start();
  checkLateTasksJob.start();
  inventoryAlertsJob.start();
  logger.info('✅ All cron jobs started');
};

// Stop all jobs
export const stopAllJobs = () => {
  autoGenerateTasksJob.stop();
  checkLateTasksJob.stop();
  inventoryAlertsJob.stop();
  logger.info('⏸️  All cron jobs stopped');
};
