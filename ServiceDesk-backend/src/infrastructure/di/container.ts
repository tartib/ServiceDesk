import { createContainer, asValue, InjectionMode, AwilixContainer } from 'awilix';
import logger from '../../utils/logger';

// ── Storage & Forms Services (resolved by module controllers) ──
import fileStorageService from '../../modules/storage/services/fileStorage.service';
import formTemplateService from '../../modules/forms/services/formTemplateService';

// ── PM Services ──
import authService from '../../modules/pm/services/auth.service';
import { methodologyService } from '../../modules/pm/services/methodology.service';
import roadmapService from '../../modules/pm/services/roadmap.service';
import socketService from '../../modules/pm/services/socket.service';
import workflowService from '../../modules/pm/services/workflow.service';

// ── Forms Services ──
import { FormFieldService } from '../../modules/forms/services/FormFieldService';
import { FormRuleService } from '../../modules/forms/services/FormRuleService';
import { FormWorkflowService } from '../../modules/forms/services/FormWorkflowService';
import { FormAccessService } from '../../modules/forms/services/FormAccessService';
import { FormSubmissionValidationService } from '../../modules/forms/services/FormSubmissionValidationService';
import { FormSubmissionTimelineService } from '../../modules/forms/services/FormSubmissionTimelineService';
import { FormSubmissionCommentService } from '../../modules/forms/services/FormSubmissionCommentService';

// ── Analytics Services ──
import { DashboardKPIService } from '../../modules/analytics/services/DashboardKPIService';
import { DashboardPerformanceService } from '../../modules/analytics/services/DashboardPerformanceService';
import { DashboardAnalyticsService } from '../../modules/analytics/services/DashboardAnalyticsService';
import { DashboardService } from '../../modules/analytics/services/DashboardService';

// ── Storage Services ──
import { FileUploadService } from '../../modules/storage/services/FileUploadService';
import { FileFolderService } from '../../modules/storage/services/FileFolderService';
import { FileShareService } from '../../modules/storage/services/FileShareService';
import { PrepTaskService } from '../../modules/storage/services/PrepTaskService';

// Create container
const container: AwilixContainer = createContainer({
  injectionMode: InjectionMode.PROXY,
});

container.register({
  // Storage & Forms
  fileStorageService: asValue(fileStorageService),
  formTemplateService: asValue(formTemplateService),

  // PM services
  authService: asValue(authService),
  methodologyService: asValue(methodologyService),
  roadmapService: asValue(roadmapService),
  socketService: asValue(socketService),
  workflowService: asValue(workflowService),

  // Forms Services
  formFieldService: asValue(new FormFieldService()),
  formRuleService: asValue(new FormRuleService()),
  formWorkflowService: asValue(new FormWorkflowService()),
  formAccessService: asValue(new FormAccessService()),
  formSubmissionValidationService: asValue(new FormSubmissionValidationService()),
  formSubmissionTimelineService: asValue(new FormSubmissionTimelineService()),
  formSubmissionCommentService: asValue(new FormSubmissionCommentService()),

  // Analytics Services
  dashboardKPIService: asValue(new DashboardKPIService()),
  dashboardPerformanceService: asValue(new DashboardPerformanceService()),
  dashboardAnalyticsService: asValue(new DashboardAnalyticsService()),
  dashboardService: asValue(new DashboardService()),

  // Storage Services
  fileUploadService: asValue(new FileUploadService()),
  fileFolderService: asValue(new FileFolderService()),
  fileShareService: asValue(new FileShareService()),
  prepTaskRefactoredService: asValue(new PrepTaskService()),

  // Utilities
  logger: asValue(logger),
});

export default container;
export { AwilixContainer };
