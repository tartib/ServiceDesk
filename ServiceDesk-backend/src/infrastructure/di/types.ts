/**
 * DI Container Type Definitions
 * Defines all service interfaces for type-safe dependency injection
 */

// Auth Service
export interface IAuthService {
  login(input: { email: string; password: string }): Promise<any>;
  register(input: any): Promise<any>;
  refreshTokens(token: string): Promise<any>;
  logout(userId: string): Promise<void>;
  changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>;
}

// ITSM Services
export interface IIncidentService {
  create(data: any, userId: string): Promise<any>;
  getById(id: string): Promise<any>;
  update(id: string, data: any): Promise<any>;
  delete(id: string): Promise<any>;
  list(filters: any, pagination: any): Promise<any>;
}

export interface IProblemService {
  create(data: any, userId: string): Promise<any>;
  getById(id: string): Promise<any>;
  update(id: string, data: any): Promise<any>;
  delete(id: string): Promise<any>;
  list(filters: any, pagination: any): Promise<any>;
}

export interface IChangeService {
  create(data: any, userId: string): Promise<any>;
  getById(id: string): Promise<any>;
  update(id: string, data: any): Promise<any>;
  delete(id: string): Promise<any>;
  list(filters: any, pagination: any): Promise<any>;
}

export interface IServiceRequestService {
  create(data: any, userId: string): Promise<any>;
  getById(id: string): Promise<any>;
  update(id: string, data: any): Promise<any>;
  delete(id: string): Promise<any>;
  list(filters: any, pagination: any): Promise<any>;
}

export interface IKnowledgeService {
  create(data: any, userId: string): Promise<any>;
  getById(id: string): Promise<any>;
  update(id: string, data: any): Promise<any>;
  delete(id: string): Promise<any>;
  search(query: string): Promise<any>;
}

export interface IAssetService {
  create(data: any): Promise<any>;
  getById(id: string): Promise<any>;
  update(id: string, data: any): Promise<any>;
  delete(id: string): Promise<any>;
  list(filters: any, pagination: any): Promise<any>;
}

// PM Services
export interface IProjectService {
  create(data: any, userId: string): Promise<any>;
  getById(id: string): Promise<any>;
  update(id: string, data: any): Promise<any>;
  delete(id: string): Promise<any>;
  list(organizationId: string, pagination: any): Promise<any>;
  archive(id: string): Promise<any>;
}

export interface ISprintService {
  create(data: any, userId: string): Promise<any>;
  getById(id: string): Promise<any>;
  update(id: string, data: any): Promise<any>;
  delete(id: string): Promise<any>;
  list(projectId: string, pagination: any): Promise<any>;
  start(id: string): Promise<any>;
  complete(id: string): Promise<any>;
}

export interface ITaskService {
  create(data: any, userId: string): Promise<any>;
  getById(id: string): Promise<any>;
  update(id: string, data: any): Promise<any>;
  delete(id: string): Promise<any>;
  list(filters: any, pagination: any): Promise<any>;
  assign(id: string, assigneeId: string): Promise<any>;
  updateStatus(id: string, status: string): Promise<any>;
}

export interface IBoardService {
  create(data: any, userId: string): Promise<any>;
  getById(id: string): Promise<any>;
  update(id: string, data: any): Promise<any>;
  delete(id: string): Promise<any>;
  list(projectId: string): Promise<any>;
}

export interface IEpicService {
  create(data: any, userId: string): Promise<any>;
  getById(id: string): Promise<any>;
  update(id: string, data: any): Promise<any>;
  delete(id: string): Promise<any>;
  list(projectId: string, pagination: any): Promise<any>;
}

export interface IBacklogService {
  getBacklog(projectId: string, pagination: any): Promise<any>;
  addToBacklog(data: any, userId: string): Promise<any>;
  moveToSprint(itemId: string, sprintId: string): Promise<any>;
  reorder(items: any[]): Promise<any>;
}

export interface IRoadmapService {
  create(data: any, userId: string): Promise<any>;
  getById(id: string): Promise<any>;
  update(id: string, data: any): Promise<any>;
  delete(id: string): Promise<any>;
  list(projectId: string): Promise<any>;
}

export interface IProjectMemberService {
  getMembers(projectId: string): Promise<any>;
  inviteMember(projectId: string, data: any): Promise<any>;
  updateRole(projectId: string, memberId: string, role: string): Promise<any>;
  removeMember(projectId: string, memberId: string): Promise<any>;
}

// Forms Services
export interface IFormTemplateService {
  create(data: any, userId: string): Promise<any>;
  getById(id: string): Promise<any>;
  update(id: string, data: any): Promise<any>;
  delete(id: string): Promise<any>;
  list(filters: any, pagination: any): Promise<any>;
  publish(id: string): Promise<any>;
  archive(id: string): Promise<any>;
}

export interface IFormSubmissionService {
  create(data: any, userId: string): Promise<any>;
  getById(id: string): Promise<any>;
  update(id: string, data: any): Promise<any>;
  delete(id: string): Promise<any>;
  list(formId: string, pagination: any): Promise<any>;
  submit(id: string): Promise<any>;
  approve(id: string, userId: string): Promise<any>;
  reject(id: string, reason: string): Promise<any>;
}

// Analytics Services
export interface IDashboardService {
  getDashboard(userId: string, period: 'daily' | 'weekly' | 'monthly'): Promise<any>;
  getKPIs(period: 'daily' | 'weekly' | 'monthly'): Promise<any>;
  getPerformanceMetrics(userId: string, period: string): Promise<any>;
  getTeamMetrics(teamId: string, period: string): Promise<any>;
}

export interface IReportService {
  create(data: any, userId: string): Promise<any>;
  getById(id: string): Promise<any>;
  list(filters: any, pagination: any): Promise<any>;
  generate(type: 'daily' | 'weekly' | 'monthly', filters: any): Promise<any>;
  export(reportId: string, format: 'pdf' | 'excel' | 'csv'): Promise<any>;
}

export interface ILeaderboardService {
  getLeaderboard(period: 'daily' | 'weekly' | 'monthly'): Promise<any>;
  getUserRank(userId: string, period: string): Promise<any>;
  getTeamRanking(teamId: string, period: string): Promise<any>;
}

// Storage Services
export interface IFileStorageService {
  upload(file: any, userId: string): Promise<any>;
  download(fileId: string): Promise<any>;
  delete(fileId: string): Promise<any>;
  list(filters: any, pagination: any): Promise<any>;
  share(fileId: string, data: any): Promise<any>;
}

export interface IFileUploadService {
  uploadFile(options: any): Promise<any>;
  uploadMultipleFiles(files: any[], userId: any, organizationId?: any, folderId?: any): Promise<any[]>;
  downloadFile(fileId: any, userId: any): Promise<{ stream: NodeJS.ReadableStream; file: any }>;
  deleteFile(fileId: any, userId: any): Promise<void>;
  permanentlyDeleteFile(fileId: any, userId: any): Promise<void>;
  restoreFile(fileId: any, userId: any): Promise<any>;
  updateFileMetadata(fileId: any, userId: any, updates: any): Promise<any>;
}

export interface IFileFolderService {
  create(data: any, userId: string): Promise<any>;
  getById(id: string): Promise<any>;
  update(id: string, data: any): Promise<any>;
  delete(id: string): Promise<any>;
  list(parentId?: string): Promise<any>;
  move(folderId: string, parentId: string): Promise<any>;
}

export interface IFileShareService {
  shareFile(options: any): Promise<any>;
  getFileByShareToken(token: string): Promise<{ file: any; shareLink: any }>;
  revokeShareLink(linkId: any, userId: any): Promise<void>;
  getShareLinks(fileId: any, userId: any): Promise<any[]>;
}

export interface IPrepTaskService {
  createTask(options: any): Promise<any>;
  getAllTasks(): Promise<any[]>;
  getTodayTasks(): Promise<any[]>;
  getTasksByStatus(status: string): Promise<any[]>;
  getTaskById(id: string): Promise<any>;
  getTasksByProductId(productId: string): Promise<any[]>;
  assignTask(taskId: string, userId: string, userName: string): Promise<any>;
  startTask(taskId: string, userId: string): Promise<any>;
  completeTask(taskId: string, preparedQuantity: number, unit: string, notes?: string): Promise<any>;
  markTaskAsLate(taskId: string): Promise<any>;
  updateTaskUsage(taskId: string, usedQuantity: number): Promise<any>;
  getUserTasks(userId: string, status?: string): Promise<any[]>;
  getWeeklyTasks(): Promise<any[]>;
  getUrgentTasks(): Promise<any[]>;
  getKanbanTasks(): Promise<{ pending: any[]; inProgress: any[]; done: any[] }>;
  getTasksByType(taskType: string): Promise<any[]>;
  getTasksByPriority(priority: string): Promise<any[]>;
  getOverdueTasks(): Promise<any[]>;
  getEscalatedTasks(): Promise<any[]>;
  rateTaskCompletion(taskId: string, score: number, userId: string): Promise<any>;
  updateOverdueTasks(): Promise<number>;
}

// Utility Services
export interface INotificationService {
  send(userId: string, notification: any): Promise<void>;
  sendBulk(userIds: string[], notification: any): Promise<void>;
  getNotifications(userId: string, pagination: any): Promise<any>;
  markAsRead(notificationId: string): Promise<void>;
}

export interface ICacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

export interface ILoggerService {
  info(message: string, meta?: any): void;
  error(message: string, error?: any): void;
  warn(message: string, meta?: any): void;
  debug(message: string, meta?: any): void;
}

// Container Registry Type
export interface IServiceRegistry {
  // Auth
  authService: IAuthService;

  // ITSM
  incidentService: IIncidentService;
  problemService: IProblemService;
  changeService: IChangeService;
  serviceRequestService: IServiceRequestService;
  knowledgeService: IKnowledgeService;
  assetService: IAssetService;

  // PM
  projectService: IProjectService;
  sprintService: ISprintService;
  taskService: ITaskService;
  boardService: IBoardService;
  epicService: IEpicService;
  backlogService: IBacklogService;
  roadmapService: IRoadmapService;
  projectMemberService: IProjectMemberService;

  // Forms
  formTemplateService: IFormTemplateService;
  formSubmissionService: IFormSubmissionService;

  // Analytics
  dashboardService: IDashboardService;
  reportService: IReportService;
  leaderboardService: ILeaderboardService;

  // Storage
  fileStorageService: IFileStorageService;
  fileFolderService: IFileFolderService;
  fileUploadService: IFileUploadService;
  fileShareService: IFileShareService;
  prepTaskRefactoredService: IPrepTaskService;

  // Utilities
  notificationService: INotificationService;
  cacheService: ICacheService;
  logger: ILoggerService;
}
