export interface TeamPerformance {
  totalMembers: number;
  activeMembers: number;
  tasksPerMember: Record<string, number>;
  completionRatePerMember: Record<string, number>;
  averagePerformanceScore: number;
  topPerformers: Array<{
    userId: string;
    userName: string;
    tasksCompleted: number;
    avgScore: number;
  }>;
}

export interface IDashboardPerformanceService {
  /**
   * حساب أداء الفريق
   */
  getTeamPerformance(
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<TeamPerformance>;

  /**
   * الحصول على أفضل المؤديين
   */
  getTopPerformers(
    limit?: number,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<Array<{ userId: string; userName: string; tasksCompleted: number; avgScore: number }>>;

  /**
   * حساب أداء عضو معين
   */
  getMemberPerformance(
    userId: string,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<{ tasksCompleted: number; completionRate: number; avgScore: number }>;

  /**
   * حساب عدد الأعضاء النشطين
   */
  getActiveMembers(
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<number>;
}
