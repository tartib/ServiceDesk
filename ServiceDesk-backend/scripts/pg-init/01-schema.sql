-- ============================================================
-- ServiceDesk PostgreSQL Schema — v1.0
-- Auto-created by pg-init on first container boot.
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- PLATFORM TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mongo_id      VARCHAR(24),                       -- original ObjectId for migration
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password      VARCHAR(255) NOT NULL,
  role          VARCHAR(30)  NOT NULL DEFAULT 'prep',
  itsm_role     VARCHAR(30)  NOT NULL DEFAULT 'end_user',
  profile_first_name  VARCHAR(100),
  profile_last_name   VARCHAR(100),
  profile_avatar      TEXT,
  profile_bio         TEXT,
  profile_title       VARCHAR(100),
  phone         VARCHAR(30),
  department    VARCHAR(100),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  fcm_token     TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email      ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_role       ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_is_active  ON users (is_active);
CREATE INDEX IF NOT EXISTS idx_users_mongo_id   ON users (mongo_id);

-- User ↔ Team join (platform teams from src/models/Team.ts)
CREATE TABLE IF NOT EXISTS user_teams (
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id   UUID NOT NULL,  -- FK added after teams table
  PRIMARY KEY (user_id, team_id)
);

-- User ↔ Organization join
CREATE TABLE IF NOT EXISTS user_organizations (
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id  UUID NOT NULL,  -- FK added after organizations table
  role             VARCHAR(20) NOT NULL DEFAULT 'member',
  joined_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, organization_id)
);

-- ── Platform Teams (src/models/Team.ts) ─────────────────────
CREATE TABLE IF NOT EXISTS teams (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mongo_id        VARCHAR(24),
  name            VARCHAR(200) NOT NULL UNIQUE,
  name_ar         VARCHAR(200) NOT NULL,
  description     TEXT,
  description_ar  TEXT,
  type            VARCHAR(30) NOT NULL DEFAULT 'support',
  leader_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teams_type      ON teams (type);
CREATE INDEX IF NOT EXISTS idx_teams_active    ON teams (is_active);
CREATE INDEX IF NOT EXISTS idx_teams_mongo_id  ON teams (mongo_id);

-- Team members (embedded array in Mongoose)
CREATE TABLE IF NOT EXISTS team_members (
  team_id    UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role       VARCHAR(20) NOT NULL DEFAULT 'member',
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  added_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  PRIMARY KEY (team_id, user_id)
);

-- Add FK to user_teams
ALTER TABLE user_teams
  ADD CONSTRAINT fk_user_teams_team FOREIGN KEY (team_id)
  REFERENCES teams(id) ON DELETE CASCADE;

-- ── Organizations (src/modules/pm/models/Organization.ts) ───
CREATE TABLE IF NOT EXISTS organizations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mongo_id        VARCHAR(24),
  name            VARCHAR(100) NOT NULL,
  slug            VARCHAR(120) NOT NULL UNIQUE,
  description     VARCHAR(500),
  logo            TEXT,
  -- settings (flattened from embedded obj)
  default_methodology  VARCHAR(20) NOT NULL DEFAULT 'scrum',
  timezone             VARCHAR(50) NOT NULL DEFAULT 'UTC',
  date_format          VARCHAR(20) NOT NULL DEFAULT 'YYYY-MM-DD',
  working_days         INTEGER[] NOT NULL DEFAULT '{1,2,3,4,5}',
  working_hours_start  VARCHAR(5)  NOT NULL DEFAULT '09:00',
  working_hours_end    VARCHAR(5)  NOT NULL DEFAULT '18:00',
  -- subscription (flattened)
  subscription_plan         VARCHAR(20) NOT NULL DEFAULT 'free',
  subscription_valid_until  TIMESTAMPTZ,
  max_projects              INTEGER NOT NULL DEFAULT 5,
  max_users                 INTEGER NOT NULL DEFAULT 10,
  max_storage               INTEGER NOT NULL DEFAULT 1,
  created_by  UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orgs_slug      ON organizations (slug);
CREATE INDEX IF NOT EXISTS idx_orgs_created_by ON organizations (created_by);
CREATE INDEX IF NOT EXISTS idx_orgs_mongo_id  ON organizations (mongo_id);

-- Add FK to user_organizations
ALTER TABLE user_organizations
  ADD CONSTRAINT fk_user_orgs_org FOREIGN KEY (organization_id)
  REFERENCES organizations(id) ON DELETE CASCADE;


-- ============================================================
-- ITSM MODULE
-- ============================================================

-- ── Service Catalog ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS itsm_service_catalogs (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mongo_id          VARCHAR(24),
  service_id        VARCHAR(50)  NOT NULL UNIQUE,
  name              VARCHAR(255) NOT NULL,
  name_ar           VARCHAR(255),
  description       TEXT NOT NULL,
  description_ar    TEXT,
  short_description VARCHAR(500),
  short_description_ar VARCHAR(500),
  category          VARCHAR(30)  NOT NULL,
  subcategory       VARCHAR(100),
  tags              TEXT[] DEFAULT '{}',
  icon              VARCHAR(100),
  color             VARCHAR(30),
  featured          BOOLEAN NOT NULL DEFAULT FALSE,
  -- request form stored as JSONB (flexible schema)
  request_form      JSONB NOT NULL DEFAULT '{"fields":[]}',
  workflow_id       VARCHAR(50),
  approval_required BOOLEAN NOT NULL DEFAULT FALSE,
  approvers         JSONB DEFAULT '[]',
  fulfillment_type  VARCHAR(20) NOT NULL DEFAULT 'manual',
  fulfillment_team  VARCHAR(100),
  auto_assignee     VARCHAR(100),
  estimated_fulfillment_time INTEGER,  -- hours
  sla_template_id   VARCHAR(50),
  priority          VARCHAR(20) NOT NULL DEFAULT 'medium',
  visibility        VARCHAR(20) NOT NULL DEFAULT 'internal',
  allowed_roles     TEXT[] DEFAULT '{}',
  allowed_departments TEXT[] DEFAULT '{}',
  status            VARCHAR(20) NOT NULL DEFAULT 'draft',
  "order"           INTEGER NOT NULL DEFAULT 0,
  -- stats (flattened)
  stats_total_requests       INTEGER NOT NULL DEFAULT 0,
  stats_completed_requests   INTEGER NOT NULL DEFAULT 0,
  stats_avg_fulfillment_time REAL    NOT NULL DEFAULT 0,
  stats_satisfaction_score   REAL    NOT NULL DEFAULT 0,
  stats_last_requested_at    TIMESTAMPTZ,
  created_by  VARCHAR(50) NOT NULL,
  updated_by  VARCHAR(50),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_svc_cat_category   ON itsm_service_catalogs (category, status);
CREATE INDEX IF NOT EXISTS idx_svc_cat_visibility ON itsm_service_catalogs (visibility);
CREATE INDEX IF NOT EXISTS idx_svc_cat_featured   ON itsm_service_catalogs (status, featured DESC, "order");
CREATE INDEX IF NOT EXISTS idx_svc_cat_tags       ON itsm_service_catalogs USING GIN (tags);

-- ── Service Requests ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS itsm_service_requests (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mongo_id           VARCHAR(24),
  request_id         VARCHAR(30) NOT NULL UNIQUE,
  service_id         VARCHAR(50) NOT NULL,
  service_name       VARCHAR(255) NOT NULL,
  service_name_ar    VARCHAR(255),
  service_category   VARCHAR(100),
  -- requester (flattened)
  requester_user_id  VARCHAR(50) NOT NULL,
  requester_name     VARCHAR(100) NOT NULL,
  requester_email    VARCHAR(255) NOT NULL,
  requester_department VARCHAR(100) NOT NULL,
  requester_phone    VARCHAR(30),
  -- on behalf of (flattened)
  on_behalf_of_user_id     VARCHAR(50),
  on_behalf_of_name        VARCHAR(100),
  on_behalf_of_email       VARCHAR(255),
  on_behalf_of_department  VARCHAR(100),
  -- form data
  form_data          JSONB NOT NULL DEFAULT '{}',
  form_data_display  JSONB DEFAULT '[]',
  -- workflow
  workflow_instance_id VARCHAR(50),
  current_state      VARCHAR(50) NOT NULL DEFAULT 'submitted',
  state_history      JSONB DEFAULT '[]',
  -- assignment (flattened)
  assigned_to_user_id VARCHAR(50),
  assigned_to_name    VARCHAR(100),
  assigned_to_at      TIMESTAMPTZ,
  assigned_to_by      VARCHAR(50),
  assigned_team       VARCHAR(100),
  -- approvals
  approval_stage     VARCHAR(100),
  approvals          JSONB DEFAULT '[]',
  -- fulfillment
  fulfillment_tasks  JSONB DEFAULT '[]',
  fulfillment_started_at   TIMESTAMPTZ,
  fulfillment_completed_at TIMESTAMPTZ,
  -- SLA (flattened)
  sla_priority              VARCHAR(20) NOT NULL DEFAULT 'medium',
  sla_target_response_time  REAL,   -- hours
  sla_target_resolution_time REAL,  -- hours
  sla_target_response_date  TIMESTAMPTZ,
  sla_target_resolution_date TIMESTAMPTZ,
  sla_actual_response_time  REAL,   -- minutes
  sla_actual_resolution_time REAL,  -- minutes
  sla_response_breached     BOOLEAN NOT NULL DEFAULT FALSE,
  sla_resolution_breached   BOOLEAN NOT NULL DEFAULT FALSE,
  sla_breach_reason         TEXT,
  sla_paused_duration       REAL NOT NULL DEFAULT 0,  -- minutes
  sla_on_hold_since         TIMESTAMPTZ,
  -- related records
  related_incidents   TEXT[] DEFAULT '{}',
  related_changes     TEXT[] DEFAULT '{}',
  related_problems    TEXT[] DEFAULT '{}',
  related_assets      TEXT[] DEFAULT '{}',
  linked_knowledge_articles TEXT[] DEFAULT '{}',
  -- communication
  comments            JSONB DEFAULT '[]',
  notifications_sent  JSONB DEFAULT '[]',
  -- satisfaction
  satisfaction_rating     SMALLINT,
  satisfaction_comment    TEXT,
  satisfaction_submitted_at TIMESTAMPTZ,
  satisfaction_submitted_by VARCHAR(50),
  -- status
  status              VARCHAR(30) NOT NULL DEFAULT 'submitted',
  status_reason       TEXT,
  submitted_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at        TIMESTAMPTZ,
  cancelled_at        TIMESTAMPTZ,
  cancelled_by        VARCHAR(50),
  cancellation_reason TEXT,
  -- metadata
  source              VARCHAR(20) NOT NULL DEFAULT 'web',
  ip_address          VARCHAR(45),
  user_agent          TEXT,
  organization_id     VARCHAR(50),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sr_request_id    ON itsm_service_requests (request_id);
CREATE INDEX IF NOT EXISTS idx_sr_service_id    ON itsm_service_requests (service_id, status);
CREATE INDEX IF NOT EXISTS idx_sr_requester     ON itsm_service_requests (requester_user_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_sr_status        ON itsm_service_requests (status);
CREATE INDEX IF NOT EXISTS idx_sr_current_state ON itsm_service_requests (current_state);
CREATE INDEX IF NOT EXISTS idx_sr_assigned      ON itsm_service_requests (assigned_to_user_id, status);
CREATE INDEX IF NOT EXISTS idx_sr_sla_deadline  ON itsm_service_requests (sla_target_resolution_date, status);
CREATE INDEX IF NOT EXISTS idx_sr_workflow      ON itsm_service_requests (workflow_instance_id);

-- ── Configuration Items (CMDB) ──────────────────────────────
CREATE TABLE IF NOT EXISTS itsm_configuration_items (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mongo_id            VARCHAR(24),
  ci_id               VARCHAR(30) NOT NULL UNIQUE,
  name                VARCHAR(255) NOT NULL,
  name_ar             VARCHAR(255),
  description         TEXT,
  description_ar      TEXT,
  ci_type             VARCHAR(30)  NOT NULL,
  status              VARCHAR(30)  NOT NULL DEFAULT 'active',
  criticality         VARCHAR(20)  NOT NULL DEFAULT 'medium',
  category            VARCHAR(100) NOT NULL,
  subcategory         VARCHAR(100),
  tags                TEXT[] DEFAULT '{}',
  organization_id     UUID REFERENCES organizations(id) ON DELETE SET NULL,
  department          VARCHAR(100),
  location            VARCHAR(255),
  site                VARCHAR(255),
  owner_id            UUID REFERENCES users(id) ON DELETE SET NULL,
  owner_name          VARCHAR(100),
  technical_owner_id  UUID REFERENCES users(id) ON DELETE SET NULL,
  technical_owner_name VARCHAR(100),
  support_group_id    VARCHAR(50),
  -- identification
  serial_number       VARCHAR(100),
  asset_tag           VARCHAR(100),
  barcode             VARCHAR(100),
  ci_model            VARCHAR(100),
  manufacturer        VARCHAR(100),
  sku                 VARCHAR(100),
  -- technical
  ip_address          VARCHAR(45),
  mac_address         VARCHAR(17),
  hostname            VARCHAR(255),
  os                  VARCHAR(100),
  os_version          VARCHAR(50),
  cpu                 VARCHAR(100),
  memory              VARCHAR(50),
  storage             VARCHAR(50),
  -- software
  version             VARCHAR(50),
  license_key         VARCHAR(255),
  license_expiry      TIMESTAMPTZ,
  install_date        TIMESTAMPTZ,
  last_scan_date      TIMESTAMPTZ,
  -- financial
  purchase_date       TIMESTAMPTZ,
  purchase_cost       NUMERIC(12,2),
  vendor              VARCHAR(200),
  warranty_expiry     TIMESTAMPTZ,
  maintenance_expiry  TIMESTAMPTZ,
  maintenance_cost    NUMERIC(12,2),
  -- hierarchy
  parent_id           UUID REFERENCES itsm_configuration_items(id) ON DELETE SET NULL,
  children            UUID[] DEFAULT '{}',
  -- relationships, dynamic attrs, monitoring as JSONB
  related_cis         JSONB DEFAULT '[]',
  dependent_services  TEXT[] DEFAULT '{}',
  dependent_users     INTEGER NOT NULL DEFAULT 0,
  attributes          JSONB DEFAULT '{}',
  monitoring_enabled  BOOLEAN NOT NULL DEFAULT FALSE,
  monitoring_config   JSONB,
  -- audit
  discovered_at       TIMESTAMPTZ,
  last_updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_updated_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by          UUID REFERENCES users(id) ON DELETE SET NULL,
  history             JSONB DEFAULT '[]',
  discovery_source    VARCHAR(100),
  discovery_id        VARCHAR(100),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ci_ci_id       ON itsm_configuration_items (ci_id);
CREATE INDEX IF NOT EXISTS idx_ci_type_status ON itsm_configuration_items (ci_type, status);
CREATE INDEX IF NOT EXISTS idx_ci_org_type    ON itsm_configuration_items (organization_id, ci_type);
CREATE INDEX IF NOT EXISTS idx_ci_category    ON itsm_configuration_items (category, subcategory);
CREATE INDEX IF NOT EXISTS idx_ci_owner       ON itsm_configuration_items (owner_id);
CREATE INDEX IF NOT EXISTS idx_ci_tags        ON itsm_configuration_items USING GIN (tags);

-- ── CI Relationships ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS itsm_ci_relationships (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id           UUID NOT NULL REFERENCES itsm_configuration_items(id) ON DELETE CASCADE,
  target_id           UUID NOT NULL REFERENCES itsm_configuration_items(id) ON DELETE CASCADE,
  relationship_type   VARCHAR(30) NOT NULL,
  direction           VARCHAR(20) NOT NULL DEFAULT 'bidirectional',
  strength            VARCHAR(10) NOT NULL DEFAULT 'strong',
  description         TEXT,
  weight              INTEGER NOT NULL DEFAULT 1,
  is_automatic        BOOLEAN NOT NULL DEFAULT FALSE,
  discovery_rule      VARCHAR(100),
  created_by          UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (source_id, target_id)
);

CREATE INDEX IF NOT EXISTS idx_ci_rel_type ON itsm_ci_relationships (relationship_type);

-- ── Automation Rules ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS itsm_automation_rules (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mongo_id         VARCHAR(24),
  rule_id          VARCHAR(30) NOT NULL UNIQUE,
  name             VARCHAR(255) NOT NULL,
  name_ar          VARCHAR(255),
  description      TEXT,
  description_ar   TEXT,
  status           VARCHAR(20) NOT NULL DEFAULT 'draft',
  organization_id  UUID REFERENCES organizations(id) ON DELETE SET NULL,
  department       VARCHAR(100),
  -- complex nested objects → JSONB
  trigger          JSONB NOT NULL DEFAULT '{}',
  conditions       JSONB NOT NULL DEFAULT '{"operator":"AND","groups":[]}',
  actions          JSONB NOT NULL DEFAULT '[]',
  execution        JSONB NOT NULL DEFAULT '{"maxExecutionsPerTicket":1,"preventReTrigger":true,"allowParallel":false,"priority":100}',
  schedule         JSONB,
  scope            JSONB NOT NULL DEFAULT '{"ticketTypes":[],"services":[],"categories":[],"priorities":[],"applyTo":"all"}',
  -- stats (flattened)
  stats_execution_count       INTEGER NOT NULL DEFAULT 0,
  stats_success_count         INTEGER NOT NULL DEFAULT 0,
  stats_failure_count         INTEGER NOT NULL DEFAULT 0,
  stats_last_executed_at      TIMESTAMPTZ,
  stats_last_execution_status VARCHAR(20),
  stats_avg_execution_time_ms REAL NOT NULL DEFAULT 0,
  -- audit
  created_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  version          INTEGER NOT NULL DEFAULT 1,
  history          JSONB DEFAULT '[]',
  is_valid         BOOLEAN NOT NULL DEFAULT FALSE,
  validation_errors TEXT[] DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ar_status_org  ON itsm_automation_rules (status, organization_id);
CREATE INDEX IF NOT EXISTS idx_ar_trigger     ON itsm_automation_rules ((trigger->>'type'));

-- ── Rule Execution Logs ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS itsm_rule_execution_logs (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_id             UUID NOT NULL REFERENCES itsm_automation_rules(id) ON DELETE CASCADE,
  rule_name           VARCHAR(255),
  trigger_ticket_id   VARCHAR(50),
  trigger_type        VARCHAR(50),
  execution_id        VARCHAR(60) NOT NULL UNIQUE,
  started_at          TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,
  duration_ms         INTEGER,
  status              VARCHAR(20),
  context             JSONB DEFAULT '{}',
  conditions_evaluated JSONB DEFAULT '[]',
  conditions_result   BOOLEAN,
  actions_executed    JSONB DEFAULT '[]',
  error               JSONB,
  retry_count         INTEGER NOT NULL DEFAULT 0,
  max_retries         INTEGER,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rel_rule   ON itsm_rule_execution_logs (rule_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_rel_exec   ON itsm_rule_execution_logs (execution_id);

-- ── Rule Templates ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS itsm_rule_templates (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id   VARCHAR(30) NOT NULL UNIQUE,
  name          VARCHAR(255) NOT NULL,
  name_ar       VARCHAR(255),
  description   TEXT,
  description_ar TEXT,
  category      VARCHAR(100) NOT NULL,
  trigger       JSONB NOT NULL DEFAULT '{}',
  conditions    JSONB NOT NULL DEFAULT '{}',
  actions       JSONB NOT NULL DEFAULT '[]',
  execution     JSONB NOT NULL DEFAULT '{}',
  scope         JSONB NOT NULL DEFAULT '{}',
  usage_count   INTEGER NOT NULL DEFAULT 0,
  is_system     BOOLEAN NOT NULL DEFAULT FALSE,
  created_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── CI Discovery Rules ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS itsm_ci_discovery_rules (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_id          VARCHAR(30) NOT NULL UNIQUE,
  name             VARCHAR(255) NOT NULL,
  description      TEXT,
  ci_type          VARCHAR(30) NOT NULL,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  priority         INTEGER NOT NULL DEFAULT 100,
  method           VARCHAR(20) NOT NULL,
  config           JSONB NOT NULL DEFAULT '{}',
  matchers         JSONB NOT NULL DEFAULT '[]',
  attribute_mapping JSONB NOT NULL DEFAULT '{}',
  organization_id  UUID REFERENCES organizations(id) ON DELETE SET NULL,
  last_run_at      TIMESTAMPTZ,
  last_run_status  VARCHAR(20),
  last_run_error   TEXT,
  next_scheduled_run TIMESTAMPTZ,
  created_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- PM MODULE
-- ============================================================

-- ── Projects ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pm_projects (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mongo_id         VARCHAR(24),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  key              VARCHAR(10) NOT NULL,
  name             VARCHAR(100) NOT NULL,
  description      VARCHAR(2000),
  avatar           TEXT,
  methodology_code VARCHAR(20) NOT NULL,
  methodology_customizations JSONB DEFAULT '{}',
  -- teams & members as JSONB arrays (complex embedded arrays)
  teams            JSONB DEFAULT '[]',
  members          JSONB DEFAULT '[]',
  issue_types      JSONB NOT NULL DEFAULT '[{"id":"epic","name":"Epic","icon":"⚡","color":"text-purple-400"},{"id":"feature","name":"Feature","icon":"📦","color":"text-orange-400"},{"id":"task","name":"Task","icon":"✓","color":"text-blue-400"},{"id":"story","name":"Story","icon":"📖","color":"text-green-400"},{"id":"bug","name":"Bug","icon":"🐛","color":"text-red-400"}]',
  settings_visibility       VARCHAR(10) NOT NULL DEFAULT 'private',
  settings_allow_external   BOOLEAN NOT NULL DEFAULT FALSE,
  status           VARCHAR(20) NOT NULL DEFAULT 'active',
  health           VARCHAR(10) NOT NULL DEFAULT 'green',
  priority         VARCHAR(20) NOT NULL DEFAULT 'medium',
  escalated        BOOLEAN NOT NULL DEFAULT FALSE,
  escalation_reason VARCHAR(500),
  start_date       TIMESTAMPTZ,
  target_end_date  TIMESTAMPTZ,
  actual_end_date  TIMESTAMPTZ,
  created_by       UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, key)
);

CREATE INDEX IF NOT EXISTS idx_proj_org_status ON pm_projects (organization_id, status);
CREATE INDEX IF NOT EXISTS idx_proj_methodology ON pm_projects (methodology_code);
CREATE INDEX IF NOT EXISTS idx_proj_mongo_id   ON pm_projects (mongo_id);

-- ── PM Teams ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pm_teams (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mongo_id         VARCHAR(24),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name             VARCHAR(100) NOT NULL,
  description      VARCHAR(500),
  avatar           TEXT,
  lead             UUID REFERENCES users(id) ON DELETE SET NULL,
  members          JSONB DEFAULT '[]',
  settings_default_capacity INTEGER NOT NULL DEFAULT 40,
  settings_sprint_length    INTEGER NOT NULL DEFAULT 14,
  settings_working_days     INTEGER[] NOT NULL DEFAULT '{1,2,3,4,5}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, name)
);

CREATE INDEX IF NOT EXISTS idx_pm_teams_org ON pm_teams (organization_id);

-- ── Tasks ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pm_tasks (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mongo_id         VARCHAR(24),
  project_id       UUID NOT NULL REFERENCES pm_projects(id) ON DELETE CASCADE,
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  key              VARCHAR(20) NOT NULL,
  number           INTEGER NOT NULL,
  type             VARCHAR(30) NOT NULL DEFAULT 'task',
  title            VARCHAR(500) NOT NULL,
  description      TEXT,
  -- status (flattened composite)
  status_id        VARCHAR(50) NOT NULL,
  status_name      VARCHAR(100) NOT NULL,
  status_category  VARCHAR(20) NOT NULL,
  priority         VARCHAR(20) NOT NULL DEFAULT 'medium',
  assignee         UUID REFERENCES users(id) ON DELETE SET NULL,
  reporter         UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  labels           TEXT[] DEFAULT '{}',
  components       TEXT[] DEFAULT '{}',
  story_points     REAL,
  original_estimate REAL,
  remaining_estimate REAL,
  time_spent       REAL DEFAULT 0,
  parent_id        UUID REFERENCES pm_tasks(id) ON DELETE SET NULL,
  epic_id          UUID REFERENCES pm_tasks(id) ON DELETE SET NULL,
  subtasks         UUID[] DEFAULT '{}',
  watchers         UUID[] DEFAULT '{}',
  sprint_id        UUID,  -- FK added after sprints table
  swimlane         VARCHAR(100),
  board_column     VARCHAR(100),
  column_order     INTEGER DEFAULT 0,
  -- methodology-specific as JSONB
  itil             JSONB,
  waterfall        JSONB,
  okr              JSONB,
  due_date         TIMESTAMPTZ,
  start_date       TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  -- embedded arrays → JSONB
  attachments      JSONB DEFAULT '[]',
  links            JSONB DEFAULT '[]',
  web_links        JSONB DEFAULT '[]',
  workflow_history  JSONB DEFAULT '[]',
  created_by       UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  updated_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, number),
  UNIQUE (project_id, key)
);

CREATE INDEX IF NOT EXISTS idx_task_org        ON pm_tasks (organization_id);
CREATE INDEX IF NOT EXISTS idx_task_assignee   ON pm_tasks (assignee);
CREATE INDEX IF NOT EXISTS idx_task_sprint     ON pm_tasks (sprint_id);
CREATE INDEX IF NOT EXISTS idx_task_status_cat ON pm_tasks (status_category);
CREATE INDEX IF NOT EXISTS idx_task_type       ON pm_tasks (type);
CREATE INDEX IF NOT EXISTS idx_task_parent     ON pm_tasks (parent_id);
CREATE INDEX IF NOT EXISTS idx_task_epic       ON pm_tasks (epic_id);
CREATE INDEX IF NOT EXISTS idx_task_labels     ON pm_tasks USING GIN (labels);
CREATE INDEX IF NOT EXISTS idx_task_proj_stat  ON pm_tasks (project_id, status_id);
CREATE INDEX IF NOT EXISTS idx_task_mongo_id   ON pm_tasks (mongo_id);

-- ── Sprints ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pm_sprints (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mongo_id         VARCHAR(24),
  project_id       UUID NOT NULL REFERENCES pm_projects(id) ON DELETE CASCADE,
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name             VARCHAR(100) NOT NULL,
  goal             VARCHAR(1000),
  number           INTEGER NOT NULL,
  status           VARCHAR(20) NOT NULL DEFAULT 'planning',
  start_date       TIMESTAMPTZ NOT NULL,
  end_date         TIMESTAMPTZ NOT NULL,
  -- capacity (flattened)
  capacity_planned   REAL NOT NULL DEFAULT 0,
  capacity_committed REAL NOT NULL DEFAULT 0,
  capacity_available REAL NOT NULL DEFAULT 0,
  team_capacity      JSONB DEFAULT '[]',
  estimation_method  VARCHAR(20) NOT NULL DEFAULT 'story_points',
  -- velocity (flattened)
  velocity_planned   REAL,
  velocity_completed REAL,
  velocity_average   REAL,
  commitment         JSONB,
  settings_require_goal      BOOLEAN NOT NULL DEFAULT TRUE,
  settings_require_estimates BOOLEAN NOT NULL DEFAULT TRUE,
  settings_enforce_capacity  BOOLEAN NOT NULL DEFAULT TRUE,
  retrospective      JSONB,
  audit_log          JSONB DEFAULT '[]',
  over_capacity_warning BOOLEAN NOT NULL DEFAULT FALSE,
  created_by         UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, number)
);

CREATE INDEX IF NOT EXISTS idx_sprint_proj_status ON pm_sprints (project_id, status);
CREATE INDEX IF NOT EXISTS idx_sprint_org         ON pm_sprints (organization_id);
CREATE INDEX IF NOT EXISTS idx_sprint_mongo_id    ON pm_sprints (mongo_id);

-- Add FK from tasks → sprints
ALTER TABLE pm_tasks
  ADD CONSTRAINT fk_task_sprint FOREIGN KEY (sprint_id)
  REFERENCES pm_sprints(id) ON DELETE SET NULL;


-- ============================================================
-- WORKFLOW ENGINE MODULE (Runtime)
-- ============================================================

-- ── Workflow Instances ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS wf_instances (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mongo_id            VARCHAR(24),
  definition_id       VARCHAR(50) NOT NULL,    -- references Mongo WorkflowDefinition
  definition_version  INTEGER NOT NULL,
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_type         VARCHAR(50) NOT NULL,
  entity_id           VARCHAR(50) NOT NULL,
  current_state       VARCHAR(100) NOT NULL,
  previous_state      VARCHAR(100),
  status              VARCHAR(30) NOT NULL DEFAULT 'active',
  parallel_branches   JSONB DEFAULT '[]',
  variables           JSONB DEFAULT '{}',
  assignment          JSONB,
  sla                 JSONB,
  timers              JSONB DEFAULT '[]',
  started_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at        TIMESTAMPTZ,
  cancelled_at        TIMESTAMPTZ,
  started_by          VARCHAR(50) NOT NULL,
  metadata            JSONB,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wfi_def_status   ON wf_instances (definition_id, status);
CREATE INDEX IF NOT EXISTS idx_wfi_org_status   ON wf_instances (organization_id, status);
CREATE INDEX IF NOT EXISTS idx_wfi_entity       ON wf_instances (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_wfi_state_status ON wf_instances (current_state, status);
CREATE INDEX IF NOT EXISTS idx_wfi_started      ON wf_instances (started_at DESC);
CREATE INDEX IF NOT EXISTS idx_wfi_org_ent_stat ON wf_instances (organization_id, entity_type, status);
CREATE INDEX IF NOT EXISTS idx_wfi_mongo_id     ON wf_instances (mongo_id);

-- ── Workflow Events ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wf_events (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mongo_id          VARCHAR(24),
  instance_id       UUID NOT NULL REFERENCES wf_instances(id) ON DELETE CASCADE,
  definition_id     VARCHAR(50) NOT NULL,
  organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_type       VARCHAR(50) NOT NULL,
  entity_id         VARCHAR(50) NOT NULL,
  type              VARCHAR(50) NOT NULL,
  from_state        VARCHAR(100),
  to_state          VARCHAR(100),
  transition_id     VARCHAR(100),
  actor_id          VARCHAR(50),
  actor_type        VARCHAR(30) NOT NULL,
  actor_name        VARCHAR(200),
  data              JSONB,
  error             TEXT,
  timestamp         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wfe_instance   ON wf_events (instance_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_wfe_def        ON wf_events (definition_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_wfe_org        ON wf_events (organization_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_wfe_entity     ON wf_events (entity_type, entity_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_wfe_type       ON wf_events (type, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_wfe_actor      ON wf_events (actor_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_wfe_inst_type  ON wf_events (instance_id, type);

-- ── External Tasks ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wf_external_tasks (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mongo_id          VARCHAR(24),
  instance_id       UUID NOT NULL REFERENCES wf_instances(id) ON DELETE CASCADE,
  definition_id     VARCHAR(50) NOT NULL,
  organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  topic             VARCHAR(200) NOT NULL,
  state_code        VARCHAR(100) NOT NULL,
  status            VARCHAR(20)  NOT NULL DEFAULT 'available',
  worker_id         VARCHAR(100),
  lock_expires_at   TIMESTAMPTZ,
  variables         JSONB DEFAULT '{}',
  result_variables  JSONB,
  retries           INTEGER NOT NULL DEFAULT 3,
  retries_left      INTEGER NOT NULL DEFAULT 3,
  priority          INTEGER NOT NULL DEFAULT 0,
  error_message     TEXT,
  error_details     TEXT,
  error_handling    VARCHAR(20) NOT NULL DEFAULT 'retry',
  locked_at         TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wfet_instance    ON wf_external_tasks (instance_id);
CREATE INDEX IF NOT EXISTS idx_wfet_topic       ON wf_external_tasks (topic);
CREATE INDEX IF NOT EXISTS idx_wfet_status      ON wf_external_tasks (status);
CREATE INDEX IF NOT EXISTS idx_wfet_lock        ON wf_external_tasks (lock_expires_at);
CREATE INDEX IF NOT EXISTS idx_wfet_fetch_lock  ON wf_external_tasks (topic, status, priority DESC);


-- ============================================================
-- ANALYTICS READ MODELS
-- ============================================================

-- ── Task Snapshot ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS analytics_task_snapshots (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id        VARCHAR(50) NOT NULL,
  source_module    VARCHAR(10) NOT NULL,   -- 'pm' | 'ops'
  organization_id  VARCHAR(50),
  project_id       VARCHAR(50),
  key              VARCHAR(30),
  title            VARCHAR(500) NOT NULL,
  type             VARCHAR(30),
  priority         VARCHAR(20),
  status           VARCHAR(50),
  status_category  VARCHAR(20),   -- 'todo' | 'in_progress' | 'done'
  assignee_id      VARCHAR(50),
  reporter_id      VARCHAR(50),
  completed_at     TIMESTAMPTZ,
  due_date         TIMESTAMPTZ,
  start_date       TIMESTAMPTZ,
  duration_hours   REAL,
  is_on_time       BOOLEAN,
  is_overdue       BOOLEAN,
  last_event_type  VARCHAR(100),
  last_event_at    TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (source_id, source_module)
);

CREATE INDEX IF NOT EXISTS idx_ats_source       ON analytics_task_snapshots (source_id);
CREATE INDEX IF NOT EXISTS idx_ats_module       ON analytics_task_snapshots (source_module);
CREATE INDEX IF NOT EXISTS idx_ats_org          ON analytics_task_snapshots (organization_id);
CREATE INDEX IF NOT EXISTS idx_ats_project      ON analytics_task_snapshots (project_id);
CREATE INDEX IF NOT EXISTS idx_ats_mod_cat_ts   ON analytics_task_snapshots (source_module, status_category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ats_mod_type_ts  ON analytics_task_snapshots (source_module, type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ats_mod_pri_ts   ON analytics_task_snapshots (source_module, priority, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ats_assignee_cat ON analytics_task_snapshots (assignee_id, status_category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ats_org_cat_ts   ON analytics_task_snapshots (organization_id, status_category, created_at DESC);

-- ── Daily KPI Snapshot ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS analytics_daily_kpi_snapshots (
  id                           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date                         VARCHAR(10) NOT NULL,  -- YYYY-MM-DD
  organization_id              VARCHAR(50),
  source_module                VARCHAR(10) NOT NULL,  -- 'pm' | 'ops' | 'all'
  total_tasks                  INTEGER NOT NULL DEFAULT 0,
  created_tasks                INTEGER NOT NULL DEFAULT 0,
  completed_tasks              INTEGER NOT NULL DEFAULT 0,
  in_progress_tasks            INTEGER NOT NULL DEFAULT 0,
  overdue_tasks                INTEGER NOT NULL DEFAULT 0,
  pending_tasks                INTEGER NOT NULL DEFAULT 0,
  critical_tasks               INTEGER NOT NULL DEFAULT 0,
  escalated_tasks              INTEGER NOT NULL DEFAULT 0,
  completion_rate              REAL NOT NULL DEFAULT 0,
  on_time_completion_rate      REAL NOT NULL DEFAULT 0,
  average_completion_time_hours REAL NOT NULL DEFAULT 0,
  total_completion_time_hours  REAL NOT NULL DEFAULT 0,
  completed_with_duration_count INTEGER NOT NULL DEFAULT 0,
  by_type                      JSONB NOT NULL DEFAULT '{}',
  by_priority                  JSONB NOT NULL DEFAULT '{}',
  by_status                    JSONB NOT NULL DEFAULT '{}',
  last_updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (date, organization_id, source_module)
);

CREATE INDEX IF NOT EXISTS idx_kpi_date   ON analytics_daily_kpi_snapshots (date);
CREATE INDEX IF NOT EXISTS idx_kpi_org    ON analytics_daily_kpi_snapshots (organization_id);
CREATE INDEX IF NOT EXISTS idx_kpi_module ON analytics_daily_kpi_snapshots (source_module);

-- ── Event Log ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS analytics_event_log (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id         VARCHAR(100) NOT NULL UNIQUE,
  event_type       VARCHAR(100) NOT NULL,
  domain           VARCHAR(20)  NOT NULL,
  entity           VARCHAR(50)  NOT NULL,
  action           VARCHAR(50)  NOT NULL,
  organization_id  VARCHAR(50),
  user_id          VARCHAR(50),
  payload          JSONB NOT NULL DEFAULT '{}',
  timestamp        TIMESTAMPTZ NOT NULL,
  processed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ael_event_id  ON analytics_event_log (event_id);
CREATE INDEX IF NOT EXISTS idx_ael_type      ON analytics_event_log (event_type);
CREATE INDEX IF NOT EXISTS idx_ael_domain    ON analytics_event_log (domain);
CREATE INDEX IF NOT EXISTS idx_ael_entity    ON analytics_event_log (entity);
CREATE INDEX IF NOT EXISTS idx_ael_action    ON analytics_event_log (action);
CREATE INDEX IF NOT EXISTS idx_ael_org       ON analytics_event_log (organization_id);
CREATE INDEX IF NOT EXISTS idx_ael_user      ON analytics_event_log (user_id);
CREATE INDEX IF NOT EXISTS idx_ael_timestamp ON analytics_event_log (timestamp);
CREATE INDEX IF NOT EXISTS idx_ael_dom_act   ON analytics_event_log (domain, action, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ael_org_dom   ON analytics_event_log (organization_id, domain, timestamp DESC);


-- ============================================================
-- HELPER: updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT table_name FROM information_schema.columns
    WHERE column_name = 'updated_at'
      AND table_schema = 'public'
      AND table_name NOT LIKE 'pg_%'
    GROUP BY table_name
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_updated_at ON %I; CREATE TRIGGER trg_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
      tbl, tbl
    );
  END LOOP;
END;
$$;

-- ============================================================
-- SLA MODULE TABLES
-- ============================================================

-- ── SLA Calendars ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sla_calendars (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL,
  name          VARCHAR(255) NOT NULL,
  name_ar       VARCHAR(255),
  timezone      VARCHAR(100) NOT NULL DEFAULT 'Asia/Riyadh',
  is_default    BOOLEAN NOT NULL DEFAULT FALSE,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_by    UUID,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sla_cal_tenant    ON sla_calendars (tenant_id);
CREATE INDEX IF NOT EXISTS idx_sla_cal_default   ON sla_calendars (tenant_id, is_default) WHERE is_default = TRUE;

-- ── SLA Calendar Working Hours ────────────────────────────────
CREATE TABLE IF NOT EXISTS sla_calendar_working_hours (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  calendar_id   UUID NOT NULL REFERENCES sla_calendars(id) ON DELETE CASCADE,
  day_of_week   INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time    TIME NOT NULL,
  end_time      TIME NOT NULL,
  is_working_day BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (calendar_id, day_of_week)
);

CREATE INDEX IF NOT EXISTS idx_sla_wh_cal ON sla_calendar_working_hours (calendar_id);

-- ── SLA Calendar Holidays ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS sla_calendar_holidays (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  calendar_id   UUID NOT NULL REFERENCES sla_calendars(id) ON DELETE CASCADE,
  holiday_date  DATE NOT NULL,
  name          VARCHAR(255),
  name_ar       VARCHAR(255),
  UNIQUE (calendar_id, holiday_date)
);

CREATE INDEX IF NOT EXISTS idx_sla_hol_cal  ON sla_calendar_holidays (calendar_id);
CREATE INDEX IF NOT EXISTS idx_sla_hol_date ON sla_calendar_holidays (holiday_date);

-- ── SLA Policies ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sla_policies (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL,
  code          VARCHAR(100) NOT NULL,
  name          VARCHAR(255) NOT NULL,
  name_ar       VARCHAR(255),
  description   TEXT,
  description_ar TEXT,
  entity_type   VARCHAR(50) NOT NULL,  -- incident, service_request, problem, change
  priority      INT NOT NULL DEFAULT 100,  -- sort order: lower = higher priority
  match_conditions JSONB NOT NULL DEFAULT '[]',  -- [{field, operator, value}]
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_by    UUID,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, code)
);

CREATE INDEX IF NOT EXISTS idx_sla_pol_tenant   ON sla_policies (tenant_id);
CREATE INDEX IF NOT EXISTS idx_sla_pol_entity   ON sla_policies (entity_type);
CREATE INDEX IF NOT EXISTS idx_sla_pol_active   ON sla_policies (tenant_id, entity_type, is_active, priority);

-- ── SLA Goals ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sla_goals (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  policy_id       UUID NOT NULL REFERENCES sla_policies(id) ON DELETE CASCADE,
  metric_key      VARCHAR(50) NOT NULL,  -- first_response, resolution, assignment, pending_customer
  target_minutes  INT NOT NULL,
  calendar_id     UUID REFERENCES sla_calendars(id) ON DELETE SET NULL,
  start_event     VARCHAR(50) NOT NULL,  -- ticket_created, assigned, status_changed
  stop_event      VARCHAR(50) NOT NULL,  -- first_reply, resolved, assigned
  pause_on_statuses  JSONB DEFAULT '[]',  -- ["waiting_customer","blocked"]
  resume_on_statuses JSONB DEFAULT '[]',  -- ["in_progress","reopened"]
  breach_severity VARCHAR(30) DEFAULT 'warning',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (policy_id, metric_key)
);

CREATE INDEX IF NOT EXISTS idx_sla_goals_policy ON sla_goals (policy_id);

-- ── SLA Escalation Rules ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS sla_escalation_rules (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id         UUID NOT NULL REFERENCES sla_goals(id) ON DELETE CASCADE,
  trigger_type    VARCHAR(50) NOT NULL,  -- before_breach, on_breach, after_breach
  offset_minutes  INT NOT NULL DEFAULT 0,
  action_type     VARCHAR(50) NOT NULL,  -- notify_assignee, notify_team_lead, notify_manager, reassign_queue, escalate_priority, webhook
  action_config   JSONB NOT NULL DEFAULT '{}',
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order      INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sla_esc_goal ON sla_escalation_rules (goal_id);

-- ── SLA Instances ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sla_instances (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL,
  ticket_id     VARCHAR(100) NOT NULL,
  ticket_type   VARCHAR(50) NOT NULL,  -- incident, service_request, problem, change
  policy_id     UUID NOT NULL REFERENCES sla_policies(id),
  status        VARCHAR(30) NOT NULL DEFAULT 'active',  -- active, completed, breached, cancelled
  started_at    TIMESTAMPTZ NOT NULL,
  stopped_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, ticket_id, policy_id)
);

CREATE INDEX IF NOT EXISTS idx_sla_inst_tenant_ticket ON sla_instances (tenant_id, ticket_id);
CREATE INDEX IF NOT EXISTS idx_sla_inst_status        ON sla_instances (status);
CREATE INDEX IF NOT EXISTS idx_sla_inst_policy        ON sla_instances (policy_id);

-- ── SLA Metric Instances ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS sla_metric_instances (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instance_id               UUID NOT NULL REFERENCES sla_instances(id) ON DELETE CASCADE,
  goal_id                   UUID REFERENCES sla_goals(id) ON DELETE SET NULL,
  metric_key                VARCHAR(50) NOT NULL,
  status                    VARCHAR(30) NOT NULL DEFAULT 'running',  -- running, paused, met, breached, cancelled
  target_minutes            INT NOT NULL,
  elapsed_business_seconds  BIGINT NOT NULL DEFAULT 0,
  remaining_business_seconds BIGINT,
  started_at                TIMESTAMPTZ NOT NULL,
  paused_at                 TIMESTAMPTZ,
  stopped_at                TIMESTAMPTZ,
  due_at                    TIMESTAMPTZ,
  breached_at               TIMESTAMPTZ,
  last_state_change_at      TIMESTAMPTZ NOT NULL,
  calendar_id               UUID REFERENCES sla_calendars(id) ON DELETE SET NULL,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (instance_id, metric_key)
);

CREATE INDEX IF NOT EXISTS idx_sla_mi_instance     ON sla_metric_instances (instance_id);
CREATE INDEX IF NOT EXISTS idx_sla_mi_status_due   ON sla_metric_instances (status, due_at);
CREATE INDEX IF NOT EXISTS idx_sla_mi_running      ON sla_metric_instances (status) WHERE status = 'running';
CREATE INDEX IF NOT EXISTS idx_sla_mi_goal         ON sla_metric_instances (goal_id);

-- ── SLA Events (Audit Trail) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS sla_events (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id           UUID NOT NULL,
  instance_id         UUID NOT NULL REFERENCES sla_instances(id) ON DELETE CASCADE,
  metric_instance_id  UUID REFERENCES sla_metric_instances(id) ON DELETE CASCADE,
  ticket_id           VARCHAR(100) NOT NULL,
  event_type          VARCHAR(50) NOT NULL,  -- policy_matched, metric_started, metric_paused, metric_resumed, metric_stopped, metric_met, metric_breached, escalation_triggered, manually_overridden
  event_source        VARCHAR(50) NOT NULL DEFAULT 'system',  -- ticket, workflow, scheduler, manual, system
  payload             JSONB DEFAULT '{}',
  occurred_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sla_ev_instance      ON sla_events (instance_id);
CREATE INDEX IF NOT EXISTS idx_sla_ev_metric        ON sla_events (metric_instance_id);
CREATE INDEX IF NOT EXISTS idx_sla_ev_ticket_time   ON sla_events (ticket_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_sla_ev_tenant_type   ON sla_events (tenant_id, event_type);

-- ============================================================
-- DONE
-- ============================================================
SELECT 'ServiceDesk PostgreSQL schema initialized successfully' AS status;
