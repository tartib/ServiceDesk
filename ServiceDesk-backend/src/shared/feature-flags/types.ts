/**
 * Feature Flag Types
 */

export interface FeatureFlag {
  /** Unique flag name (snake_case) */
  name: string;
  /** Whether the flag is currently enabled */
  enabled: boolean;
  /** Human-readable description */
  description: string;
  /** Arabic description */
  descriptionAr?: string;
  /** Percentage of users who should see the feature (0–100). Only applies when enabled=true. */
  rolloutPercentage: number;
  /** If set, only these roles can access the feature */
  allowedRoles?: string[];
  /** If set, only these organization IDs can access the feature */
  allowedOrgs?: string[];
  /** Category for grouping in the admin UI */
  category: FeatureFlagCategory;
  /** When the flag was last modified */
  updatedAt?: Date;
  /** Who last modified the flag */
  updatedBy?: string;
}

export enum FeatureFlagCategory {
  CORE = 'core',
  ITSM = 'itsm',
  PM = 'pm',
  WORKFLOW = 'workflow',
  INTEGRATIONS = 'integrations',
  PLATFORM = 'platform',
  EXPERIMENTAL = 'experimental',
}

export interface FeatureFlagContext {
  userId?: string;
  orgId?: string;
  role?: string;
}

export interface FeatureFlagUpdate {
  enabled?: boolean;
  rolloutPercentage?: number;
  allowedRoles?: string[];
  allowedOrgs?: string[];
  description?: string;
  descriptionAr?: string;
}
