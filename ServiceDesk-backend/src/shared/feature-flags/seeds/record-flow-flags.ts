/**
 * Record Flow Feature Flags — Seed Data
 *
 * Run via: npx ts-node src/shared/feature-flags/seeds/record-flow-flags.ts
 * Or import seedRecordFlowFlags() from application bootstrap.
 */

import { FeatureFlagCategory } from '../types';

export interface FlagSeed {
  name: string;
  description: string;
  descriptionAr: string;
  category: FeatureFlagCategory;
  enabled: boolean;
  rolloutPercentage: number;
}

export const RECORD_FLOW_FLAGS: FlagSeed[] = [
  {
    name: 'new_request_flow',
    description: 'Enable the unified CreateRequestFlow UI and new record creation API endpoints',
    descriptionAr: 'تفعيل واجهة إنشاء الطلب الموحدة ونقاط API الجديدة لإنشاء السجلات',
    category: FeatureFlagCategory.RECORDS,
    enabled: false,
    rolloutPercentage: 100,
  },
  {
    name: 'unified_record_detail',
    description: 'Enable the unified RecordDetailPage with activity timeline and quick actions',
    descriptionAr: 'تفعيل صفحة تفاصيل السجل الموحدة مع الجدول الزمني للأنشطة والإجراءات السريعة',
    category: FeatureFlagCategory.RECORDS,
    enabled: false,
    rolloutPercentage: 100,
  },
  {
    name: 'workspace_based_navigation',
    description: 'Enable workspace-type-aware sidebar navigation and request type filtering',
    descriptionAr: 'تفعيل التنقل المبني على نوع مساحة العمل وتصفية أنواع الطلبات',
    category: FeatureFlagCategory.RECORDS,
    enabled: false,
    rolloutPercentage: 100,
  },
  {
    name: 'client_portal_mvp',
    description: 'Enable the external client portal with token-based access',
    descriptionAr: 'تفعيل بوابة العملاء الخارجية مع الوصول المبني على الرموز',
    category: FeatureFlagCategory.RECORDS,
    enabled: false,
    rolloutPercentage: 100,
  },
  {
    name: 'auto_workflow_attachment',
    description: 'Automatically attach workflow instances when creating records with a workflow template',
    descriptionAr: 'ربط سير العمل تلقائياً عند إنشاء السجلات المرتبطة بقالب سير عمل',
    category: FeatureFlagCategory.RECORDS,
    enabled: false,
    rolloutPercentage: 100,
  },
  {
    name: 'sla_engine_v2',
    description: 'Enable SLA policy binding to RecordItem entities',
    descriptionAr: 'تفعيل ربط سياسات اتفاقية مستوى الخدمة بكيانات السجلات',
    category: FeatureFlagCategory.RECORDS,
    enabled: false,
    rolloutPercentage: 100,
  },
];

/**
 * Upsert record-flow feature flags into the database.
 * Safe to run multiple times — uses upsert on flag name.
 */
export async function seedRecordFlowFlags(): Promise<void> {
  // Lazy import to avoid circular deps at module load time
  const FeatureFlagModel = (await import('../../../models/FeatureFlag')).default;

  for (const flag of RECORD_FLOW_FLAGS) {
    await FeatureFlagModel.updateOne(
      { name: flag.name },
      {
        $setOnInsert: {
          name: flag.name,
          enabled: flag.enabled,
          description: flag.description,
          descriptionAr: flag.descriptionAr,
          category: flag.category,
          rolloutPercentage: flag.rolloutPercentage,
        },
      },
      { upsert: true },
    );
  }
}
