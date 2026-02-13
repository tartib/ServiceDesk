/**
 * Analytics & Reporting DTOs
 */

// Report DTOs
export interface CreateReportDTO {
  name: string;
  description?: string;
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  startDate: Date;
  endDate: Date;
  metrics: string[];
  filters?: {
    status?: string;
    priority?: string;
    assignee?: string;
    category?: string;
  };
}

export interface ReportDTO {
  id: string;
  name: string;
  description?: string;
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  startDate: Date;
  endDate: Date;
  generatedAt: Date;
  generatedBy: string;
  data: ReportDataDTO;
}

export interface ReportDataDTO {
  summary: {
    totalItems: number;
    completedItems: number;
    pendingItems: number;
    overdueItems: number;
    completionRate: number;
  };
  metrics: Record<string, unknown>;
  trends: TrendDataDTO[];
  topPerformers: PerformerDTO[];
}

export interface TrendDataDTO {
  date: Date;
  value: number;
  label: string;
}

export interface PerformerDTO {
  userId: string;
  userName: string;
  score: number;
  itemsCompleted: number;
  averageTime: number;
}

// Daily Report DTOs
export interface DailyReportDTO {
  date: Date;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  completionRate: number;
  averageCompletionTime: number;
  tasksByType: Record<string, number>;
  tasksByPriority: Record<string, number>;
  topPerformers: PerformerDTO[];
  delays: number;
  earlyCompletions: number;
}

// Weekly Report DTOs
export interface WeeklyReportDTO {
  weekStart: Date;
  weekEnd: Date;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  averageCompletionTime: number;
  overdueTasks: number;
  escalatedTasks: number;
  dailyBreakdown: DailyBreakdownDTO[];
  teamPerformance: TeamPerformanceDTO[];
  trends: {
    completionRateTrend: number;
    productivityTrend: number;
  };
}

export interface DailyBreakdownDTO {
  date: Date;
  tasks: number;
  completed: number;
}

export interface TeamPerformanceDTO {
  userId: string;
  userName: string;
  tasksCompleted: number;
  avgScore: number;
  efficiency: number;
}

// Monthly Report DTOs
export interface MonthlyReportDTO {
  month: number;
  year: number;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  averageCompletionTime: number;
  overdueTasks: number;
  escalatedTasks: number;
  weeklyBreakdown: WeeklyBreakdownDTO[];
  departmentPerformance: DepartmentPerformanceDTO[];
  trends: {
    completionRateTrend: number;
    productivityTrend: number;
    qualityTrend: number;
  };
}

export interface WeeklyBreakdownDTO {
  week: number;
  tasks: number;
  completed: number;
}

export interface DepartmentPerformanceDTO {
  departmentId: string;
  departmentName: string;
  tasksCompleted: number;
  avgScore: number;
  efficiency: number;
}

// KPI DTOs
export interface KPIDTO {
  id: string;
  name: string;
  description?: string;
  type: 'numeric' | 'percentage' | 'ratio';
  target: number;
  current: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
  lastUpdated: Date;
}

export interface KPIDashboardDTO {
  period: 'daily' | 'weekly' | 'monthly';
  kpis: KPIDTO[];
  summary: {
    meetsTarget: number;
    belowTarget: number;
    aboveTarget: number;
  };
}

// Performance Metrics DTOs
export interface PerformanceMetricsDTO {
  userId: string;
  userName: string;
  period: 'daily' | 'weekly' | 'monthly';
  tasksCompleted: number;
  tasksAssigned: number;
  completionRate: number;
  averageCompletionTime: number;
  qualityScore: number;
  efficiency: number;
  onTimeDelivery: number;
}

export interface TeamMetricsDTO {
  teamId: string;
  teamName: string;
  memberCount: number;
  tasksCompleted: number;
  tasksAssigned: number;
  completionRate: number;
  averageCompletionTime: number;
  qualityScore: number;
  efficiency: number;
}

// Leaderboard DTOs
export interface LeaderboardEntryDTO {
  rank: number;
  userId: string;
  userName: string;
  score: number;
  tasksCompleted: number;
  completionRate: number;
  department?: string;
}

export interface LeaderboardDTO {
  period: 'daily' | 'weekly' | 'monthly';
  generatedAt: Date;
  entries: LeaderboardEntryDTO[];
}

// Dashboard DTOs
export interface DashboardDTO {
  userId: string;
  period: 'daily' | 'weekly' | 'monthly';
  summary: DashboardSummaryDTO;
  kpis: KPIDTO[];
  recentActivities: ActivityDTO[];
  upcomingTasks: TaskPreviewDTO[];
  charts: ChartDataDTO[];
}

export interface DashboardSummaryDTO {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  completionRate: number;
}

export interface ActivityDTO {
  id: string;
  type: string;
  description: string;
  actor: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface TaskPreviewDTO {
  id: string;
  title: string;
  dueDate: Date;
  priority: string;
  assignee: string;
}

export interface ChartDataDTO {
  type: 'line' | 'bar' | 'pie' | 'area';
  title: string;
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor?: string;
      borderColor?: string;
    }[];
  };
}

// Analytics Filter DTOs
export interface AnalyticsFilterDTO {
  startDate?: Date;
  endDate?: Date;
  status?: string[];
  priority?: string[];
  assignee?: string[];
  category?: string[];
  department?: string[];
}

// Export DTOs
export interface ExportReportDTO {
  reportId: string;
  format: 'pdf' | 'excel' | 'csv' | 'json';
  includeCharts?: boolean;
  includeDetails?: boolean;
}

export interface ExportedReportDTO {
  id: string;
  fileName: string;
  format: string;
  size: number;
  url: string;
  createdAt: Date;
  expiresAt: Date;
}
