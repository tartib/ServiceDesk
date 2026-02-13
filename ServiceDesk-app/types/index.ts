// User Types
export type UserRole =
  | 'prep'
  | 'supervisor'
  | 'manager'
  | 'backend_developer'
  | 'frontend_developer'
  | 'mobile_developer'
  | 'fullstack_developer'
  | 'security_engineer'
  | 'sre'
  | 'product_owner'
  | 'project_manager'
  | 'ui_ux'
  | 'network_engineer'
  | 'system_engineer'
  | 'business_analyst'
  | 'qa';

export const ALL_ROLES: UserRole[] = [
  'prep', 'supervisor', 'manager',
  'backend_developer', 'frontend_developer', 'mobile_developer', 'fullstack_developer',
  'security_engineer', 'sre', 'product_owner', 'project_manager',
  'ui_ux', 'network_engineer', 'system_engineer', 'business_analyst', 'qa',
];

export const ROLE_LABELS: Record<UserRole, string> = {
  prep: 'Prep',
  supervisor: 'Supervisor',
  manager: 'Manager',
  backend_developer: 'Backend Developer',
  frontend_developer: 'Frontend Developer',
  mobile_developer: 'Mobile Developer',
  fullstack_developer: 'Full Stack Developer',
  security_engineer: 'Security Engineer',
  sre: 'SRE',
  product_owner: 'Product Owner',
  project_manager: 'Project Manager',
  ui_ux: 'UI/UX',
  network_engineer: 'Network Engineer',
  system_engineer: 'System Engineer',
  business_analyst: 'Business Analyst',
  qa: 'QA',
};

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  isActive: boolean;
  fcmToken?: string;
  createdAt: string;
  updatedAt: string;
}

// Category Types
export interface Category {
  id: string;
  _id?: string;
  name: string;
  nameAr: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Task Types
export type TaskStatus = 'scheduled' | 'in_progress' | 'completed' | 'overdue' | 'pending' | 'late' | 'stock_issue' | 'done';
export type TaskType = 'red_alert' | 'medium' | 'daily_recurring' | 'weekly_recurring' | 'on_demand';
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';
export type AssignmentType = 'specific_user' | 'any_team_member';

export interface Task {
  _id: string;
  id?: string; // For backward compatibility
  productId: string | {
    _id: string;
    name: string;
    category: string;
  };
  productName: string;
  scheduledAt: string;
  dueAt: string;
  taskType: TaskType;
  priority: TaskPriority;
  assignedTo?: {
    _id: string;
    name: string;
    email: string;
  } | string;
  assignedToName?: string;
  assignmentType: AssignmentType;
  status: TaskStatus;
  prepTimeMinutes: number;
  estimatedDuration: number;
  isOverdue: boolean;
  isEscalated: boolean;
  isRecurring: boolean;
  notes?: string;
  tags?: string[];
  timeRemaining?: number;
  startedAt?: string;
  completedAt?: string;
  actualDuration?: number;
  preparedQuantity?: number;
  usedQuantity?: number;
  unit?: string;
  waste?: number;
  performanceScore?: number;
  completionScore?: number;
  recurringPattern?: string;
  escalatedAt?: string;
  escalatedTo?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Product Types
export interface RequiredIngredient {
  ingredientId: string;
  name: string;
  quantity: number;
  unit: 'kg' | 'g' | 'l' | 'ml' | 'pcs' | 'cup' | 'tbsp' | 'tsp';
}

export interface Product {
  id: string;
  _id?: string;
  name: string;
  nameAr?: string;
  category: string;
  description?: string;
  image?: string;
  prepTimeMinutes: number;
  prepIntervalHours: number;
  ingredients: RequiredIngredient[];
  isActive: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

// Inventory Types
export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';
export type InventoryCategory = 'meat' | 'vegetable' | 'dairy' | 'grain' | 'spice' | 'sauce' | 'other';

export interface InventoryItem {
  id: string;
  _id?: string;
  name: string;
  nameAr?: string;
  category: InventoryCategory | string;
  unit: 'kg' | 'g' | 'l' | 'ml' | 'pcs' | 'cup' | 'tbsp' | 'tsp';
  currentQuantity: number;
  minThreshold: number;
  maxThreshold: number;
  status: StockStatus;
  image?: string;
  lastRestocked?: string;
  supplier?: string;
  cost?: number;
  lastUpdated?: string;
  createdAt: string;
  updatedAt: string;
}

// Notification Types
export type NotificationType = 'reminder' | 'start' | 'late' | 'overdue' | 'critical' | 'stock_issue' | 'completion' | 'escalation' | 'before_due';
export type NotificationLevel = 'info' | 'warning' | 'error' | 'critical';

export interface Notification {
  _id: string;
  id?: string;
  userId: string | { _id: string; name: string; email: string };
  type: NotificationType;
  level: NotificationLevel;
  priority: TaskPriority;
  title: string;
  message: string;
  relatedTaskId?: string | {
    _id: string;
    productName: string;
    status: TaskStatus;
    priority: TaskPriority;
  };
  relatedInventoryId?: string;
  isRead: boolean;
  sentAt: string;
  readAt?: string;
  scheduledFor?: string;
  isEscalation: boolean;
  escalatedFrom?: string;
  actionRequired: boolean;
  actionUrl?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt?: string;
}

// Comment Types
export interface Comment {
  _id: string;
  id?: string;
  taskId: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  } | string;
  userName: string;
  comment: string;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

// Execution Log Types
export type ExecutionAction = 'created' | 'assigned' | 'started' | 'completed' | 'escalated' | 'reassigned' | 'commented' | 'rated' | 'updated';

export interface ExecutionLog {
  _id: string;
  id?: string;
  taskId: string | {
    _id: string;
    productName: string;
    status: TaskStatus;
    priority: TaskPriority;
  };
  userId?: {
    _id: string;
    name: string;
    email: string;
  };
  userName: string;
  action: ExecutionAction;
  oldStatus?: TaskStatus;
  newStatus?: TaskStatus;
  details: string;
  metadata?: Record<string, string | number | boolean | null>;
  createdAt: string;
}

// Dashboard Types
export interface DashboardKPIs {
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

export interface TaskDistribution {
  byType: Record<TaskType, number>;
  byPriority: Record<TaskPriority, number>;
  byStatus: Record<TaskStatus, number>;
}

export interface TimeAnalysis {
  tasksByHour: Record<string, number>;
  tasksByDayOfWeek: Record<string, number>;
  peakHours: number[];
  averageTaskDuration: number;
  estimatedVsActual: {
    onTime: number;
    delayed: number;
    early: number;
  };
}

export interface RecentActivity {
  id: string;
  type: 'task';
  action: string;
  taskName: string;
  assignedTo: string;
  timestamp: string;
  priority: TaskPriority;
}

export interface CriticalAlert {
  id: string;
  type: 'overdue' | 'escalated';
  severity: 'high' | 'critical';
  message: string;
  taskId: string;
  assignedTo: string;
  timestamp: string;
}

export interface DashboardData {
  kpis: DashboardKPIs;
  teamPerformance: TeamPerformance;
  taskDistribution: TaskDistribution;
  timeAnalysis: TimeAnalysis;
  recentActivity: RecentActivity[];
  criticalAlerts: CriticalAlert[];
  trends: {
    completionRateTrend: number;
    overdueRateTrend: number;
  };
}

// Report Types
export interface DailyReport {
  _id?: string;
  id?: string;
  date: string;
  taskSummary: {
    totalTasks: number;
    completedTasks: number;
    lateTasks: number;
    inProgressTasks: number;
    stockIssueTasks: number;
  };
  employeePerformance: Array<{
    userId: string;
    userName: string;
    tasksCompleted: number;
    averageCompletionTime: number;
    onTimeCompletions: number;
    lateCompletions: number;
  }>;
  inventoryUsage: Array<{
    ingredientId: string;
    ingredientName: string;
    quantityUsed: number;
    unit: string;
  }>;
  totalPrepared: number;
  totalUsed: number;
  totalWaste: number;
  wastePercentage: number;
  notes?: string;
  generatedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  averageCompletionTime: number;
  overdueTasks: number;
  escalatedTasks: number;
  dailyBreakdown: Array<{
    date: string;
    tasks: number;
    completed: number;
  }>;
  teamPerformance: Array<{
    userId: string;
    userName: string;
    tasksCompleted: number;
    avgScore: number;
  }>;
  trends: {
    completionRateTrend: number;
    productivityTrend: number;
  };
}

export interface MonthlyReport {
  month: number;
  year: number;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  averageCompletionTime: number;
  overdueTasks: number;
  escalatedTasks: number;
  weeklyBreakdown: Array<{
    week: number;
    tasks: number;
    completed: number;
  }>;
  teamPerformance: Array<{
    userId: string;
    userName: string;
    tasksCompleted: number;
    avgScore: number;
    hoursWorked: number;
  }>;
  insights: {
    bestDay: string;
    worstDay: string;
    peakHours: number[];
    improvementAreas: string[];
  };
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
  unreadCount?: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form Types
export interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface ProductFormData {
  name: string;
  category: string;
  description?: string;
  prepTimeMinutes: number;
  prepIntervalHours: number;
  ingredients: RequiredIngredient[];
  isActive: boolean;
  image?: string;
}

export interface InventoryFormData {
  name: string;
  nameAr?: string;
  category: string;
  unit: string;
  currentQuantity: number;
  minThreshold: number;
  maxThreshold: number;
  image?: string;
  supplier?: string;
  cost?: number;
}

export interface InventoryFormDataWithImage extends InventoryFormData {
  imageFile?: File;
}

export interface InventoryUsage {
  itemId: string;
  quantityUsed: number;
}

export interface TaskFormData {
  productId: string;
  scheduledAt: string;
  taskType: TaskType;
  priority?: TaskPriority;
  assignedTo?: string;
  assignedToName?: string;
  assignmentType?: AssignmentType;
  notes?: string;
  tags?: string[];
}

export interface CompleteTaskData {
  preparedQuantity: number;
  unit: string;
  notes?: string;
}

export interface RateTaskData {
  score: number;
  userId: string;
}

export interface EscalateTaskData {
  reason: string;
}

// Kanban Types
export interface KanbanData {
  pending: Task[];
  inProgress: Task[];
  done: Task[];
}

export interface KanbanResponse {
  data: KanbanData;
  counts: {
    pending: number;
    inProgress: number;
    done: number;
  };
}

// Audit Log Types
export type AuditAction = 'create' | 'update' | 'delete' | 'start_task' | 'complete_task' | 'inventory_update' | 'assign_task' | 'comment_add' | 'escalate';

export interface AuditLog {
  _id: string;
  id?: string;
  userId?: string | { _id: string; name: string; email: string };
  userName?: string;
  action: AuditAction;
  entity: string;
  entityId?: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}
