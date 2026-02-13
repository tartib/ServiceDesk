import { createContainer, asValue, InjectionMode, AwilixContainer } from 'awilix';
import logger from '../../utils/logger';

// Import services - they export named functions/objects
import * as alertService from '../../services/alertService';
import * as categoryService from '../../services/categoryService';
import * as dailyReportService from '../../services/dailyReportService';
import * as dashboardService from '../../services/dashboardService';
import fileStorageService from '../../services/fileStorage.service';
import formSubmissionService from '../../services/formSubmissionService';
import formTemplateService from '../../services/formTemplateService';
import * as inventoryService from '../../services/inventoryService';
import * as leaderboardService from '../../services/leaderboardService';
import * as notificationService from '../../services/notificationService';
import * as prepTaskService from '../../services/prepTaskService';
import * as ratingService from '../../services/ratingService';
import * as reportService from '../../services/reportService';
import * as taskCommentService from '../../services/taskCommentService';
import * as taskExecutionLogService from '../../services/taskExecutionLogService';

// PM Services
import authService from '../../services/pm/auth.service';
import { methodologyService } from '../../services/pm/methodology.service';
import roadmapService from '../../services/pm/roadmap.service';
import socketService from '../../services/pm/socket.service';
import workflowService from '../../services/pm/workflow.service';

// Refactored Form Services (Phase 3.1 & 3.2)
import { FormFieldService } from '../../services/forms/FormFieldService';
import { FormRuleService } from '../../services/forms/FormRuleService';
import { FormWorkflowService } from '../../services/forms/FormWorkflowService';
import { FormAccessService } from '../../services/forms/FormAccessService';
import { FormSubmissionValidationService } from '../../services/forms/FormSubmissionValidationService';
import { FormSubmissionTimelineService } from '../../services/forms/FormSubmissionTimelineService';
import { FormSubmissionCommentService } from '../../services/forms/FormSubmissionCommentService';

// Refactored Analytics Services (Phase 3.3)
import { DashboardKPIService } from '../../services/analytics/DashboardKPIService';
import { DashboardPerformanceService } from '../../services/analytics/DashboardPerformanceService';
import { DashboardAnalyticsService } from '../../services/analytics/DashboardAnalyticsService';
import { DashboardService } from '../../services/analytics/DashboardService.refactored';

// Refactored Storage Services (Phase 3.4)
import { FileUploadService } from '../../services/storage/FileUploadService';
import { FileFolderService } from '../../services/storage/FileFolderService';
import { FileShareService } from '../../services/storage/FileShareService';
import { PrepTaskService } from '../../services/storage/PrepTaskService';

// Create container
const container: AwilixContainer = createContainer({
  injectionMode: InjectionMode.PROXY,
});

// Register services as modules (for named exports) or values (for default exports)
container.register({
  // Core services (named exports)
  alertService: asValue(alertService),
  categoryService: asValue(categoryService),
  dailyReportService: asValue(dailyReportService),
  dashboardService: asValue(dashboardService),
  inventoryService: asValue(inventoryService),
  leaderboardService: asValue(leaderboardService),
  notificationService: asValue(notificationService),
  prepTaskService: asValue(prepTaskService),
  ratingService: asValue(ratingService),
  reportService: asValue(reportService),
  taskCommentService: asValue(taskCommentService),
  taskExecutionLogService: asValue(taskExecutionLogService),

  // Services with default exports
  fileStorageService: asValue(fileStorageService),
  formSubmissionService: asValue(formSubmissionService),
  formTemplateService: asValue(formTemplateService),

  // PM services
  authService: asValue(authService),
  methodologyService: asValue(methodologyService),
  roadmapService: asValue(roadmapService),
  socketService: asValue(socketService),
  workflowService: asValue(workflowService),

  // Refactored Form Services (Phase 3.1 & 3.2)
  formFieldService: asValue(new FormFieldService()),
  formRuleService: asValue(new FormRuleService()),
  formWorkflowService: asValue(new FormWorkflowService()),
  formAccessService: asValue(new FormAccessService()),
  formSubmissionValidationService: asValue(new FormSubmissionValidationService()),
  formSubmissionTimelineService: asValue(new FormSubmissionTimelineService()),
  formSubmissionCommentService: asValue(new FormSubmissionCommentService()),

  // Refactored Analytics Services (Phase 3.3)
  dashboardKPIService: asValue(new DashboardKPIService()),
  dashboardPerformanceService: asValue(new DashboardPerformanceService()),
  dashboardAnalyticsService: asValue(new DashboardAnalyticsService()),
  dashboardRefactoredService: asValue(new DashboardService()),

  // Refactored Storage Services (Phase 3.4)
  fileUploadService: asValue(new FileUploadService()),
  fileFolderService: asValue(new FileFolderService()),
  fileShareService: asValue(new FileShareService()),
  prepTaskRefactoredService: asValue(new PrepTaskService()),

  // Utilities
  logger: asValue(logger),
});

export default container;
export { AwilixContainer };
