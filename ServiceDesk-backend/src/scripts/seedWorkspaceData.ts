/**
 * Seed Workspace Demo Data — Section 2, Batch 1
 *
 * Creates sample data for each MVP workspace type:
 *   - Demo organization per workspace type
 *   - Request types from workspace-templates.ts
 *   - Sample RecordItems (5 per workspace type)
 *
 * Usage:
 *   npx ts-node src/scripts/seedWorkspaceData.ts
 *   Or import seedAllWorkspaceData() from bootstrap.
 */

import mongoose from 'mongoose';
import { WorkspaceType, WORKSPACE_TYPE_LABELS } from '../shared/types/workspace.types';
import {
  seedWorkspaceRequestTypes,
  getAvailableWorkspaceTypes,
} from '../modules/forms/seeds/workspace-templates';
import { RecordItemStatus, RecordPriority, RecordSourceType } from '../modules/forms/models/RecordItem';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/servicedesk';
const DEMO_USER_ID = 'demo-admin';

interface SampleRecord {
  title: string;
  titleAr: string;
  status: RecordItemStatus;
  priority: RecordPriority;
}

const SAMPLE_RECORDS: Record<WorkspaceType, SampleRecord[]> = {
  [WorkspaceType.PRODUCT_STUDIO]: [
    { title: 'Login page crashes on mobile Safari', titleAr: 'صفحة تسجيل الدخول تتعطل على سفاري', status: RecordItemStatus.IN_PROGRESS, priority: RecordPriority.CRITICAL },
    { title: 'Add dark mode support', titleAr: 'إضافة دعم الوضع الداكن', status: RecordItemStatus.SUBMITTED, priority: RecordPriority.MEDIUM },
    { title: 'Implement user onboarding flow', titleAr: 'تنفيذ مسار تهيئة المستخدم', status: RecordItemStatus.UNDER_REVIEW, priority: RecordPriority.HIGH },
    { title: 'Review dashboard redesign mockups', titleAr: 'مراجعة نماذج إعادة تصميم لوحة المعلومات', status: RecordItemStatus.WAITING_CLIENT, priority: RecordPriority.LOW },
    { title: 'Optimize API response times', titleAr: 'تحسين أوقات استجابة API', status: RecordItemStatus.COMPLETED, priority: RecordPriority.HIGH },
  ],
  [WorkspaceType.MARKETING_AGENCY]: [
    { title: 'Q3 Brand Awareness Campaign', titleAr: 'حملة الوعي بالعلامة التجارية Q3', status: RecordItemStatus.IN_PROGRESS, priority: RecordPriority.HIGH },
    { title: 'Blog post: Industry Trends 2026', titleAr: 'مقال مدونة: اتجاهات الصناعة 2026', status: RecordItemStatus.SUBMITTED, priority: RecordPriority.MEDIUM },
    { title: 'Social media assets for product launch', titleAr: 'أصول وسائل التواصل لإطلاق المنتج', status: RecordItemStatus.UNDER_REVIEW, priority: RecordPriority.HIGH },
    { title: 'Client feedback on homepage redesign', titleAr: 'ملاحظات العميل على إعادة تصميم الصفحة الرئيسية', status: RecordItemStatus.WAITING_CLIENT, priority: RecordPriority.CRITICAL },
    { title: 'Email newsletter template', titleAr: 'قالب النشرة البريدية', status: RecordItemStatus.COMPLETED, priority: RecordPriority.LOW },
  ],
  [WorkspaceType.PROFESSIONAL_SERVICE_OFFICE]: [
    { title: 'Acme Corp Financial Audit FY2026', titleAr: 'تدقيق مالي لشركة أكمي 2026', status: RecordItemStatus.IN_PROGRESS, priority: RecordPriority.HIGH },
    { title: 'Monthly report for GlobalTech', titleAr: 'تقرير شهري لجلوبال تك', status: RecordItemStatus.SUBMITTED, priority: RecordPriority.MEDIUM },
    { title: 'Review Q2 timesheets', titleAr: 'مراجعة سجلات ساعات العمل Q2', status: RecordItemStatus.UNDER_REVIEW, priority: RecordPriority.LOW },
    { title: 'Invoice dispute — Project Alpha', titleAr: 'اعتراض فاتورة — مشروع ألفا', status: RecordItemStatus.WAITING_CLIENT, priority: RecordPriority.HIGH },
    { title: 'Onboard new client: StartupXYZ', titleAr: 'تهيئة عميل جديد: StartupXYZ', status: RecordItemStatus.COMPLETED, priority: RecordPriority.MEDIUM },
  ],
  [WorkspaceType.ACCOUNTING_OFFICE]: [],
  [WorkspaceType.LEGAL_OFFICE]: [],
};

export async function seedAllWorkspaceData(): Promise<{ requestTypes: number; records: number }> {
  const RecordItemModel = (await import('../modules/forms/models/RecordItem')).default;

  let totalRequestTypes = 0;
  let totalRecords = 0;

  const workspaceTypes = getAvailableWorkspaceTypes();

  for (const wsType of workspaceTypes) {
    const label = WORKSPACE_TYPE_LABELS[wsType].en;
    console.log(`\n🏢 Seeding workspace: ${label}`);

    // 1. Seed request types
    const seeded = await seedWorkspaceRequestTypes(wsType, `demo-org-${wsType}`, DEMO_USER_ID);
    totalRequestTypes += seeded;
    console.log(`  ✅ Request types: ${seeded} new (idempotent)`);

    // 2. Seed sample records
    const samples = SAMPLE_RECORDS[wsType] ?? [];
    for (const sample of samples) {
      const exists = await RecordItemModel.findOne({
        title: sample.title,
        organizationId: `demo-org-${wsType}`,
      });
      if (exists) continue;

      const doc = new RecordItemModel({
        title: sample.title,
        description: sample.titleAr,
        workspaceType: wsType,
        status: sample.status,
        priority: sample.priority,
        requesterId: DEMO_USER_ID,
        requesterName: 'Demo User',
        requesterEmail: 'demo@example.com',
        sourceType: RecordSourceType.RECORD,
        organizationId: `demo-org-${wsType}`,
      });
      await doc.generateRecordNumber();
      await doc.save();
      totalRecords++;
    }
    console.log(`  ✅ Sample records: ${samples.length} checked`);
  }

  return { requestTypes: totalRequestTypes, records: totalRecords };
}

// ── CLI runner ─────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding workspace demo data...\n');

  await mongoose.connect(MONGO_URI);
  console.log('📦 Connected to MongoDB');

  const result = await seedAllWorkspaceData();

  console.log(`\n✨ Done! Created ${result.requestTypes} request types, ${result.records} records.`);
  await mongoose.disconnect();
}

if (require.main === module) {
  main().catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  });
}
