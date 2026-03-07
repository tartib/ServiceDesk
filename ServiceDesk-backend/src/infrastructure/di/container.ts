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
import authService from '../../modules/pm/services/auth.service';
import { methodologyService } from '../../modules/pm/services/methodology.service';
import roadmapService from '../../modules/pm/services/roadmap.service';
import socketService from '../../modules/pm/services/socket.service';
import workflowService from '../../modules/pm/services/workflow.service';

// Refactored Form Services (Phase 3.1 & 3.2)
import { FormFieldService } from '../../modules/forms/services/FormFieldService';
import { FormRuleService } from '../../modules/forms/services/FormRuleService';
import { FormWorkflowService } from '../../modules/forms/services/FormWorkflowService';
import { FormAccessService } from '../../modules/forms/services/FormAccessService';
import { FormSubmissionValidationService } from '../../modules/forms/services/FormSubmissionValidationService';
import { FormSubmissionTimelineService } from '../../modules/forms/services/FormSubmissionTimelineService';
import { FormSubmissionCommentService } from '../../modules/forms/services/FormSubmissionCommentService';

// Refactored Analytics Services (Phase 3.3)
import { DashboardKPIService } from '../../modules/analytics/services/DashboardKPIService';
import { DashboardPerformanceService } from '../../modules/analytics/services/DashboardPerformanceService';
import { DashboardAnalyticsService } from '../../modules/analytics/services/DashboardAnalyticsService';
import { DashboardService } from '../../modules/analytics/services/DashboardService.refactored';

// Refactored Storage Services (Phase 3.4)
import { FileUploadService } from '../../modules/storage/services/FileUploadService';
import { FileFolderService } from '../../modules/storage/services/FileFolderService';
import { FileShareService } from '../../modules/storage/services/FileShareService';
import { PrepTaskService } from '../../modules/storage/services/PrepTaskService';

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
