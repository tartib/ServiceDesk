/**
 * Default Feature Flag Definitions
 *
 * These serve as the fallback when the database is unavailable.
 * The DB-stored values always take precedence over these defaults.
 */

import { FeatureFlag, FeatureFlagCategory } from './types';

export const defaultFlags: FeatureFlag[] = [
  // ── Core ──────────────────────────────────────────────────
  {
    name: 'feature_flags_admin_ui',
    enabled: true,
    description: 'Feature flags admin management page',
    descriptionAr: 'صفحة إدارة أعلام الميزات',
    rolloutPercentage: 100,
    category: FeatureFlagCategory.CORE,
  },

  // ── Workflow Engine ───────────────────────────────────────
  {
    name: 'workflow_engine_enabled',
    enabled: true,
    description: 'Generic BPMN workflow engine module',
    descriptionAr: 'وحدة محرك سير العمل العام BPMN',
    rolloutPercentage: 100,
    category: FeatureFlagCategory.WORKFLOW,
  },
  {
    name: 'external_tasks_enabled',
    enabled: true,
    description: 'External task polling for workflow engine',
    descriptionAr: 'استطلاع المهام الخارجية لمحرك سير العمل',
    rolloutPercentage: 100,
    category: FeatureFlagCategory.WORKFLOW,
  },

  // ── ITSM ──────────────────────────────────────────────────
  {
    name: 'itsm_module_enabled',
    enabled: true,
    description: 'IT Service Management module (Catalog, Requests, CMDB, Automation)',
    descriptionAr: 'وحدة إدارة خدمات تقنية المعلومات',
    rolloutPercentage: 100,
    category: FeatureFlagCategory.ITSM,
  },
  {
    name: 'itsm_automation_rules',
    enabled: true,
    description: 'Automation rules engine for ITSM',
    descriptionAr: 'محرك قواعد الأتمتة لـ ITSM',
    rolloutPercentage: 100,
    category: FeatureFlagCategory.ITSM,
  },

  // ── PM ────────────────────────────────────────────────────
  {
    name: 'pm_module_enabled',
    enabled: true,
    description: 'Project Management module',
    descriptionAr: 'وحدة إدارة المشاريع',
    rolloutPercentage: 100,
    category: FeatureFlagCategory.PM,
  },
  {
    name: 'pm_retrospectives_enabled',
    enabled: true,
    description: 'Sprint retrospectives feature',
    descriptionAr: 'ميزة مراجعات السبرنت',
    rolloutPercentage: 100,
    category: FeatureFlagCategory.PM,
  },
  {
    name: 'pm_planning_poker_enabled',
    enabled: true,
    description: 'Planning poker estimation sessions',
    descriptionAr: 'جلسات تقدير بوكر التخطيط',
    rolloutPercentage: 100,
    category: FeatureFlagCategory.PM,
  },
  {
    name: 'pm_standups_enabled',
    enabled: true,
    description: 'Daily standup tracking',
    descriptionAr: 'تتبع الاجتماعات اليومية',
    rolloutPercentage: 100,
    category: FeatureFlagCategory.PM,
  },

  // ── Integrations ──────────────────────────────────────────
  {
    name: 'integrations_email_enabled',
    enabled: false,
    description: 'Email (SMTP) integration adapter',
    descriptionAr: 'محول تكامل البريد الإلكتروني',
    rolloutPercentage: 100,
    category: FeatureFlagCategory.INTEGRATIONS,
  },
  {
    name: 'integrations_slack_enabled',
    enabled: false,
    description: 'Slack Bot API integration adapter',
    descriptionAr: 'محول تكامل سلاك',
    rolloutPercentage: 100,
    category: FeatureFlagCategory.INTEGRATIONS,
  },
  {
    name: 'integrations_teams_enabled',
    enabled: false,
    description: 'Microsoft Teams webhook integration adapter',
    descriptionAr: 'محول تكامل مايكروسوفت تيمز',
    rolloutPercentage: 100,
    category: FeatureFlagCategory.INTEGRATIONS,
  },
  {
    name: 'integrations_github_enabled',
    enabled: false,
    description: 'GitHub webhook integration adapter',
    descriptionAr: 'محول تكامل جيت هب',
    rolloutPercentage: 100,
    category: FeatureFlagCategory.INTEGRATIONS,
  },

  // ── SLA ─────────────────────────────────────────────────────
  {
    name: 'sla_module_enabled',
    enabled: true,
    description: 'SLA Service module (policies, calendars, breach detection, escalation)',
    descriptionAr: 'وحدة اتفاقيات مستوى الخدمة (السياسات، التقويمات، كشف الاختراق، التصعيد)',
    rolloutPercentage: 100,
    category: FeatureFlagCategory.PLATFORM,
  },

  // ── Platform ──────────────────────────────────────────────
  {
    name: 'smart_forms_enabled',
    enabled: true,
    description: 'Smart Forms engine with conditional logic',
    descriptionAr: 'محرك النماذج الذكية مع المنطق الشرطي',
    rolloutPercentage: 100,
    category: FeatureFlagCategory.PLATFORM,
  },
  {
    name: 'knowledge_base_enabled',
    enabled: true,
    description: 'Knowledge base articles and search',
    descriptionAr: 'مقالات قاعدة المعرفة والبحث',
    rolloutPercentage: 100,
    category: FeatureFlagCategory.PLATFORM,
  },
  {
    name: 'file_drive_enabled',
    enabled: true,
    description: 'File drive (MinIO storage)',
    descriptionAr: 'محرك الملفات (تخزين MinIO)',
    rolloutPercentage: 100,
    category: FeatureFlagCategory.PLATFORM,
  },

  // ── Legacy v1 Routes (Kill Switch) ──────────────────────────
  {
    name: 'legacy_v1_routes_enabled',
    enabled: true,
    description: 'Master switch for all legacy v1 API routes (sunset: 2026-09-01)',
    descriptionAr: 'مفتاح رئيسي لجميع مسارات API القديمة v1',
    rolloutPercentage: 100,
    category: FeatureFlagCategory.CORE,
  },
  {
    name: 'legacy_auth_routes',
    enabled: true,
    description: 'Legacy auth, users, teams, employees routes',
    descriptionAr: 'مسارات المصادقة والمستخدمين والفرق القديمة',
    rolloutPercentage: 100,
    category: FeatureFlagCategory.CORE,
  },
  {
    name: 'legacy_ops_routes',
    enabled: true,
    description: 'Legacy tasks, categories, inventory, assets routes',
    descriptionAr: 'مسارات المهام والفئات والمخزون والأصول القديمة',
    rolloutPercentage: 100,
    category: FeatureFlagCategory.CORE,
  },
  {
    name: 'legacy_itsm_v1_routes',
    enabled: true,
    description: 'Legacy ITSM v1 routes (incidents, problems, changes, SLAs)',
    descriptionAr: 'مسارات ITSM v1 القديمة',
    rolloutPercentage: 100,
    category: FeatureFlagCategory.CORE,
  },
  {
    name: 'legacy_forms_routes',
    enabled: true,
    description: 'Legacy form templates and submissions routes',
    descriptionAr: 'مسارات قوالب النماذج والتقديمات القديمة',
    rolloutPercentage: 100,
    category: FeatureFlagCategory.CORE,
  },
  {
    name: 'legacy_files_routes',
    enabled: true,
    description: 'Legacy file storage, folders, workflow diagram routes',
    descriptionAr: 'مسارات تخزين الملفات والمجلدات القديمة',
    rolloutPercentage: 100,
    category: FeatureFlagCategory.CORE,
  },
  {
    name: 'legacy_misc_routes',
    enabled: true,
    description: 'Legacy knowledge, reports, KPI, alerts, performance, leaderboard routes',
    descriptionAr: 'مسارات المعرفة والتقارير والمؤشرات القديمة',
    rolloutPercentage: 100,
    category: FeatureFlagCategory.CORE,
  },

  // ── Experimental ──────────────────────────────────────────
  {
    name: 'hybrid_db_postgresql',
    enabled: false,
    description: 'Use PostgreSQL for ITSM/PM data (experimental)',
    descriptionAr: 'استخدام PostgreSQL لبيانات ITSM/PM (تجريبي)',
    rolloutPercentage: 0,
    category: FeatureFlagCategory.EXPERIMENTAL,
  },
  {
    name: 'workflow_engine_remote',
    enabled: false,
    description: 'Use remote workflow engine microservice (experimental)',
    descriptionAr: 'استخدام خدمة محرك سير العمل عن بعد (تجريبي)',
    rolloutPercentage: 0,
    category: FeatureFlagCategory.EXPERIMENTAL,
  },
];
