/**
 * Permission Policies
 * 
 * Defines what each role can do per domain
 */

import {
  Permission,
  PermissionPolicy,
  RESOURCES,
} from './permission.types';

// ============================================================
// ORGANIZATION POLICIES
// ============================================================

export const organizationPolicies: PermissionPolicy[] = [
  {
    roles: ['owner'],
    permissions: [
      { resource: RESOURCES.ORGANIZATION, action: 'manage', scope: 'organization' },
      { resource: RESOURCES.ORGANIZATION, action: 'delete', scope: 'organization' },
      { resource: RESOURCES.USER, action: 'manage', scope: 'organization' },
      { resource: RESOURCES.TEAM, action: 'manage', scope: 'organization' },
    ],
  },
  {
    roles: ['admin'],
    permissions: [
      { resource: RESOURCES.ORGANIZATION, action: 'update', scope: 'organization' },
      { resource: RESOURCES.USER, action: 'manage', scope: 'organization' },
      { resource: RESOURCES.TEAM, action: 'manage', scope: 'organization' },
    ],
  },
  {
    roles: ['member'],
    permissions: [
      { resource: RESOURCES.ORGANIZATION, action: 'read', scope: 'organization' },
      { resource: RESOURCES.USER, action: 'read', scope: 'organization' },
      { resource: RESOURCES.TEAM, action: 'read', scope: 'organization' },
    ],
  },
];

// ============================================================
// PROJECT POLICIES (PM DOMAIN)
// ============================================================

export const projectPolicies: PermissionPolicy[] = [
  {
    roles: ['lead'],
    permissions: [
      // Project management
      { resource: RESOURCES.PROJECT, action: 'manage', scope: 'project' },
      { resource: RESOURCES.PROJECT, action: 'delete', scope: 'project' },
      // Work items
      { resource: RESOURCES.WORK_ITEM, action: 'create', scope: 'project' },
      { resource: RESOURCES.WORK_ITEM, action: 'read', scope: 'project' },
      { resource: RESOURCES.WORK_ITEM, action: 'update', scope: 'project' },
      { resource: RESOURCES.WORK_ITEM, action: 'delete', scope: 'project' },
      { resource: RESOURCES.WORK_ITEM, action: 'transition', scope: 'project' },
      { resource: RESOURCES.WORK_ITEM, action: 'assign', scope: 'project' },
      // Sprints
      { resource: RESOURCES.SPRINT, action: 'manage', scope: 'project' },
      // Comments
      { resource: RESOURCES.COMMENT, action: 'manage', scope: 'project' },
    ],
  },
  {
    roles: ['manager'],
    permissions: [
      { resource: RESOURCES.PROJECT, action: 'update', scope: 'project' },
      { resource: RESOURCES.WORK_ITEM, action: 'create', scope: 'project' },
      { resource: RESOURCES.WORK_ITEM, action: 'read', scope: 'project' },
      { resource: RESOURCES.WORK_ITEM, action: 'update', scope: 'project' },
      { resource: RESOURCES.WORK_ITEM, action: 'delete', scope: 'project' },
      { resource: RESOURCES.WORK_ITEM, action: 'transition', scope: 'project' },
      { resource: RESOURCES.WORK_ITEM, action: 'assign', scope: 'project' },
      { resource: RESOURCES.SPRINT, action: 'manage', scope: 'project' },
      { resource: RESOURCES.COMMENT, action: 'create', scope: 'project' },
      { resource: RESOURCES.COMMENT, action: 'update', scope: 'own' },
      { resource: RESOURCES.COMMENT, action: 'delete', scope: 'own' },
    ],
  },
  {
    roles: ['contributor', 'member'],
    permissions: [
      { resource: RESOURCES.PROJECT, action: 'read', scope: 'project' },
      { resource: RESOURCES.WORK_ITEM, action: 'create', scope: 'project' },
      { resource: RESOURCES.WORK_ITEM, action: 'read', scope: 'project' },
      { resource: RESOURCES.WORK_ITEM, action: 'update', scope: 'own', conditions: { isAssignee: true } },
      { resource: RESOURCES.WORK_ITEM, action: 'update', scope: 'own', conditions: { isReporter: true } },
      { resource: RESOURCES.WORK_ITEM, action: 'transition', scope: 'own' },
      { resource: RESOURCES.WORK_ITEM, action: 'assign', scope: 'own' },
      { resource: RESOURCES.SPRINT, action: 'read', scope: 'project' },
      { resource: RESOURCES.COMMENT, action: 'create', scope: 'project' },
      { resource: RESOURCES.COMMENT, action: 'update', scope: 'own' },
      { resource: RESOURCES.COMMENT, action: 'delete', scope: 'own' },
    ],
  },
  {
    roles: ['viewer'],
    permissions: [
      { resource: RESOURCES.PROJECT, action: 'read', scope: 'project' },
      { resource: RESOURCES.WORK_ITEM, action: 'read', scope: 'project' },
      { resource: RESOURCES.SPRINT, action: 'read', scope: 'project' },
      { resource: RESOURCES.COMMENT, action: 'read', scope: 'project' },
    ],
  },
];

// ============================================================
// OPS POLICIES
// ============================================================

export const opsPolicies: PermissionPolicy[] = [
  {
    roles: ['supervisor'],
    permissions: [
      { resource: RESOURCES.WORK_ORDER, action: 'create', scope: 'organization' },
      { resource: RESOURCES.WORK_ORDER, action: 'read', scope: 'organization' },
      { resource: RESOURCES.WORK_ORDER, action: 'update', scope: 'organization' },
      { resource: RESOURCES.WORK_ORDER, action: 'delete', scope: 'organization' },
      { resource: RESOURCES.WORK_ORDER, action: 'transition', scope: 'organization' },
      { resource: RESOURCES.WORK_ORDER, action: 'assign', scope: 'organization' },
      { resource: RESOURCES.SCHEDULE, action: 'manage', scope: 'organization' },
      { resource: RESOURCES.PRODUCT, action: 'read', scope: 'organization' },
    ],
  },
  {
    roles: ['operator'],
    permissions: [
      { resource: RESOURCES.WORK_ORDER, action: 'read', scope: 'own', conditions: { isAssignee: true } },
      { resource: RESOURCES.WORK_ORDER, action: 'transition', scope: 'own', conditions: { isAssignee: true } },
      { resource: RESOURCES.PRODUCT, action: 'read', scope: 'organization' },
    ],
  },
];

// ============================================================
// SERVICE DESK / ITSM POLICIES
// ============================================================

export const serviceDeskPolicies: PermissionPolicy[] = [
  // ---- service_owner (maps from itsmRole: admin / manager) ----
  {
    roles: ['service_owner'],
    permissions: [
      // Legacy ticket resource
      { resource: RESOURCES.TICKET, action: 'manage', scope: 'organization' },
      { resource: RESOURCES.ASSET, action: 'manage', scope: 'organization' },
      { resource: RESOURCES.SLA, action: 'manage', scope: 'organization' },

      // Service Catalog — full control
      { resource: RESOURCES.CATALOG, action: 'manage', scope: 'organization' },

      // Service Requests — full control
      { resource: RESOURCES.SERVICE_REQUEST, action: 'manage', scope: 'organization' },

      // Incidents, Problems, Changes, Releases — full control
      { resource: RESOURCES.INCIDENT, action: 'manage', scope: 'organization' },
      { resource: RESOURCES.PROBLEM, action: 'manage', scope: 'organization' },
      { resource: RESOURCES.CHANGE, action: 'manage', scope: 'organization' },
      { resource: RESOURCES.RELEASE, action: 'manage', scope: 'organization' },

      // CMDB — full control
      { resource: RESOURCES.CMDB, action: 'manage', scope: 'organization' },

      // Automation Rules — full control
      { resource: RESOURCES.AUTOMATION_RULE, action: 'manage', scope: 'organization' },

      // Knowledge Base
      { resource: RESOURCES.KNOWLEDGE, action: 'manage', scope: 'organization' },
    ],
  },

  // ---- analyst (maps from itsmRole: team_lead / cab_member) ----
  {
    roles: ['analyst'],
    permissions: [
      // Legacy ticket resource
      { resource: RESOURCES.TICKET, action: 'create', scope: 'organization' },
      { resource: RESOURCES.TICKET, action: 'read', scope: 'organization' },
      { resource: RESOURCES.TICKET, action: 'update', scope: 'organization' },
      { resource: RESOURCES.TICKET, action: 'transition', scope: 'organization' },
      { resource: RESOURCES.TICKET, action: 'assign', scope: 'organization' },
      { resource: RESOURCES.ASSET, action: 'read', scope: 'organization' },

      // Service Catalog — read only
      { resource: RESOURCES.CATALOG, action: 'read', scope: 'organization' },

      // Service Requests — read all in org, transition, assign
      { resource: RESOURCES.SERVICE_REQUEST, action: 'read', scope: 'organization' },
      { resource: RESOURCES.SERVICE_REQUEST, action: 'update', scope: 'organization' },
      { resource: RESOURCES.SERVICE_REQUEST, action: 'transition', scope: 'organization' },
      { resource: RESOURCES.SERVICE_REQUEST, action: 'assign', scope: 'organization' },

      // Incidents — create, read, update, transition, assign within org
      { resource: RESOURCES.INCIDENT, action: 'create', scope: 'organization' },
      { resource: RESOURCES.INCIDENT, action: 'read', scope: 'organization' },
      { resource: RESOURCES.INCIDENT, action: 'update', scope: 'organization' },
      { resource: RESOURCES.INCIDENT, action: 'transition', scope: 'organization' },
      { resource: RESOURCES.INCIDENT, action: 'assign', scope: 'organization' },

      // Problems
      { resource: RESOURCES.PROBLEM, action: 'create', scope: 'organization' },
      { resource: RESOURCES.PROBLEM, action: 'read', scope: 'organization' },
      { resource: RESOURCES.PROBLEM, action: 'update', scope: 'organization' },
      { resource: RESOURCES.PROBLEM, action: 'transition', scope: 'organization' },

      // Changes — read + transition (CAB approval)
      { resource: RESOURCES.CHANGE, action: 'read', scope: 'organization' },
      { resource: RESOURCES.CHANGE, action: 'transition', scope: 'organization' },

      // Releases — read
      { resource: RESOURCES.RELEASE, action: 'read', scope: 'organization' },

      // CMDB — read + update
      { resource: RESOURCES.CMDB, action: 'read', scope: 'organization' },
      { resource: RESOURCES.CMDB, action: 'update', scope: 'organization' },

      // Automation Rules — read only
      { resource: RESOURCES.AUTOMATION_RULE, action: 'read', scope: 'organization' },

      // Knowledge Base
      { resource: RESOURCES.KNOWLEDGE, action: 'read', scope: 'organization' },
      { resource: RESOURCES.KNOWLEDGE, action: 'create', scope: 'organization' },
    ],
  },

  // ---- agent (maps from itsmRole: technician) ----
  {
    roles: ['agent'],
    permissions: [
      // Legacy ticket
      { resource: RESOURCES.TICKET, action: 'read', scope: 'team' },
      { resource: RESOURCES.TICKET, action: 'update', scope: 'own', conditions: { isAssignee: true } },
      { resource: RESOURCES.TICKET, action: 'transition', scope: 'own', conditions: { isAssignee: true } },
      { resource: RESOURCES.ASSET, action: 'read', scope: 'organization' },

      // Service Catalog — read
      { resource: RESOURCES.CATALOG, action: 'read', scope: 'organization' },

      // Service Requests — read team's, update/transition assigned
      { resource: RESOURCES.SERVICE_REQUEST, action: 'read', scope: 'team' },
      { resource: RESOURCES.SERVICE_REQUEST, action: 'update', scope: 'own', conditions: { isAssignee: true } },
      { resource: RESOURCES.SERVICE_REQUEST, action: 'transition', scope: 'own', conditions: { isAssignee: true } },

      // Incidents — read team's, update/transition assigned
      { resource: RESOURCES.INCIDENT, action: 'read', scope: 'team' },
      { resource: RESOURCES.INCIDENT, action: 'update', scope: 'own', conditions: { isAssignee: true } },
      { resource: RESOURCES.INCIDENT, action: 'transition', scope: 'own', conditions: { isAssignee: true } },

      // Problems — read
      { resource: RESOURCES.PROBLEM, action: 'read', scope: 'team' },

      // Changes — read
      { resource: RESOURCES.CHANGE, action: 'read', scope: 'team' },

      // CMDB — read
      { resource: RESOURCES.CMDB, action: 'read', scope: 'organization' },

      // Knowledge Base — read
      { resource: RESOURCES.KNOWLEDGE, action: 'read', scope: 'organization' },
    ],
  },

  // ---- end_user (maps from itsmRole: end_user) ----
  {
    roles: ['end_user'],
    permissions: [
      // Legacy ticket — create own, read own
      { resource: RESOURCES.TICKET, action: 'create', scope: 'own' },
      { resource: RESOURCES.TICKET, action: 'read', scope: 'own', conditions: { isReporter: true } },

      // Service Catalog — read (browse available services)
      { resource: RESOURCES.CATALOG, action: 'read', scope: 'organization' },

      // Service Requests — create own, read own
      { resource: RESOURCES.SERVICE_REQUEST, action: 'create', scope: 'own' },
      { resource: RESOURCES.SERVICE_REQUEST, action: 'read', scope: 'own', conditions: { isReporter: true } },

      // Incidents — create own, read own
      { resource: RESOURCES.INCIDENT, action: 'create', scope: 'own' },
      { resource: RESOURCES.INCIDENT, action: 'read', scope: 'own', conditions: { isReporter: true } },

      // Knowledge Base — read (self-service)
      { resource: RESOURCES.KNOWLEDGE, action: 'read', scope: 'organization' },
    ],
  },
];

// ============================================================
// ALL POLICIES COMBINED
// ============================================================

export const allPolicies: PermissionPolicy[] = [
  ...organizationPolicies,
  ...projectPolicies,
  ...opsPolicies,
  ...serviceDeskPolicies,
];

export default allPolicies;
