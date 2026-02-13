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
// SERVICE DESK POLICIES
// ============================================================

export const serviceDeskPolicies: PermissionPolicy[] = [
  {
    roles: ['service_owner'],
    permissions: [
      { resource: RESOURCES.TICKET, action: 'manage', scope: 'organization' },
      { resource: RESOURCES.ASSET, action: 'manage', scope: 'organization' },
      { resource: RESOURCES.CATALOG, action: 'manage', scope: 'organization' },
      { resource: RESOURCES.SLA, action: 'manage', scope: 'organization' },
    ],
  },
  {
    roles: ['analyst'],
    permissions: [
      { resource: RESOURCES.TICKET, action: 'create', scope: 'organization' },
      { resource: RESOURCES.TICKET, action: 'read', scope: 'organization' },
      { resource: RESOURCES.TICKET, action: 'update', scope: 'organization' },
      { resource: RESOURCES.TICKET, action: 'transition', scope: 'organization' },
      { resource: RESOURCES.TICKET, action: 'assign', scope: 'organization' },
      { resource: RESOURCES.ASSET, action: 'read', scope: 'organization' },
      { resource: RESOURCES.CATALOG, action: 'read', scope: 'organization' },
    ],
  },
  {
    roles: ['agent'],
    permissions: [
      { resource: RESOURCES.TICKET, action: 'read', scope: 'own', conditions: { isAssignee: true } },
      { resource: RESOURCES.TICKET, action: 'update', scope: 'own', conditions: { isAssignee: true } },
      { resource: RESOURCES.TICKET, action: 'transition', scope: 'own', conditions: { isAssignee: true } },
      { resource: RESOURCES.ASSET, action: 'read', scope: 'organization' },
      { resource: RESOURCES.CATALOG, action: 'read', scope: 'organization' },
    ],
  },
  {
    roles: ['end_user'],
    permissions: [
      { resource: RESOURCES.TICKET, action: 'create', scope: 'own' },
      { resource: RESOURCES.TICKET, action: 'read', scope: 'own', conditions: { isReporter: true } },
      { resource: RESOURCES.CATALOG, action: 'read', scope: 'organization' },
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
