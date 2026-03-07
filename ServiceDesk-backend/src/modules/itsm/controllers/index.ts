export {
  getServices,
  getService,
  createService,
  updateService,
  deleteService,
  getCategories,
  getFeaturedServices,
} from './serviceCatalog.controller';

export {
  createRequest,
  getRequests,
  getRequest,
  approveRequest,
  rejectRequest,
  cancelRequest,
  assignRequest,
  addComment,
} from './serviceRequest.controller';

export {
  getConfigItems,
  getConfigItem,
  createConfigItem,
  updateConfigItem,
  deleteConfigItem,
  getRelationships,
  createRelationship,
  deleteRelationship,
  getImpactAnalysis,
  getCITypes,
  getCMDBStats,
} from './cmdb.controller';

export {
  getRules,
  getRule,
  createRule,
  updateRule,
  deleteRule,
  activateRule,
  deactivateRule,
  getRuleLogs,
  getTemplates,
  createRuleFromTemplate,
  getAutomationStats,
} from './automationRule.controller';
