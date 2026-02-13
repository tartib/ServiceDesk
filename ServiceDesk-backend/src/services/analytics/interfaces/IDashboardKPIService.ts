export interface TaskKPIs {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  pendingTasks: number;
  completionRate: number;
  onTimeCompletionRate: number;
  averageCompletionTime: number;
  criticalTasks: number;
  escalatedTasks: number;
}

export interface IDashboardKPIService {
  /**
   * حساب مؤشرات الأداء الرئيسية
   */
  calculateKPIs(
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<TaskKPIs>;

  /**
   * حساب معدل الإنجاز
   */
  calculateCompletionRate(
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<number>;

  /**
   * حساب المهام المتأخرة
   */
  getOverdueTasks(
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<number>;

  /**
   * حساب متوسط وقت الإنجاز
   */
  getAverageCompletionTime(
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<number>;

  /**
   * حساب معدل الإنجاز في الموعد
   */
  getOnTimeCompletionRate(
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<number>;
}
