export interface TaskDistribution {
  byType: Record<string, number>;
  byPriority: Record<string, number>;
  byStatus: Record<string, number>;
}

export interface TimeAnalysis {
  tasksByHour: Record<number, number>;
  tasksByDayOfWeek: Record<number, number>;
  peakHours: number[];
  averageTaskDuration: number;
  estimatedVsActual: {
    onTime: number;
    delayed: number;
    early: number;
  };
}

export interface IDashboardAnalyticsService {
  /**
   * توزيع المهام حسب النوع والأولوية والحالة
   */
  getTaskDistribution(
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<TaskDistribution>;

  /**
   * تحليل المهام حسب الوقت
   */
  getTimeAnalysis(
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<TimeAnalysis>;

  /**
   * الحصول على ساعات الذروة
   */
  getPeakHours(
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<number[]>;

  /**
   * حساب متوسط مدة المهمة
   */
  getAverageTaskDuration(
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<number>;

  /**
   * توزيع المهام حسب النوع
   */
  getTasksByType(
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<Record<string, number>>;

  /**
   * توزيع المهام حسب الأولوية
   */
  getTasksByPriority(
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<Record<string, number>>;
}
