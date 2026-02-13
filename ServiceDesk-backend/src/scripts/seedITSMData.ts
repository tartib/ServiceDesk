import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

import Incident from '../core/entities/Incident';
import Problem from '../core/entities/Problem';
import Change from '../core/entities/Change';
import SLA from '../core/entities/SLA';
import Site from '../core/entities/Site';
import ITSMCategory from '../core/entities/Category';
import Counter from '../core/entities/Counter';
import {
  IncidentStatus,
  ProblemStatus,
  ChangeStatus,
  ChangeType,
  Priority,
  Impact,
  Urgency,
  Channel,
  RiskLevel,
  ApprovalStatus,
} from '../core/types/itsm.types';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/servicedesk';

async function seedData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing ITSM data
    await Promise.all([
      Incident.deleteMany({}),
      Problem.deleteMany({}),
      Change.deleteMany({}),
      SLA.deleteMany({}),
      Site.deleteMany({}),
      ITSMCategory.deleteMany({}),
      Counter.deleteMany({}),
    ]);
    console.log('Cleared existing ITSM data');

    // Create Sites
    const sites = await Site.create([
      {
        site_id: 'SITE-2025-00001',
        name: 'Headquarters',
        name_ar: 'المقر الرئيسي',
        code: 'HQ',
        address: {
          city: 'Riyadh',
          country: 'Saudi Arabia',
          region: 'Central',
        },
        timezone: 'Asia/Riyadh',
        contact: {
          email: 'hq@servicedesk.com',
          phone: '+966-11-1234567',
        },
        is_active: true,
      },
      {
        site_id: 'SITE-2025-00002',
        name: 'Branch Office - Jeddah',
        name_ar: 'فرع جدة',
        code: 'JED',
        address: {
          city: 'Jeddah',
          country: 'Saudi Arabia',
          region: 'Western',
        },
        timezone: 'Asia/Riyadh',
        is_active: true,
      },
    ]);
    console.log(`Created ${sites.length} sites`);

    // Create Categories
    const categories = await ITSMCategory.create([
      {
        category_id: 'CAT-2025-00001',
        name: 'Hardware',
        name_ar: 'الأجهزة',
        description: 'Hardware related issues',
        applies_to: ['incident', 'problem', 'change'],
        subcategories: [
          { subcategory_id: 'SUB-001', name: 'Desktop', name_ar: 'سطح المكتب', is_active: true },
          { subcategory_id: 'SUB-002', name: 'Laptop', name_ar: 'حاسب محمول', is_active: true },
          { subcategory_id: 'SUB-003', name: 'Printer', name_ar: 'طابعة', is_active: true },
        ],
        order: 1,
        is_active: true,
      },
      {
        category_id: 'CAT-2025-00002',
        name: 'Software',
        name_ar: 'البرمجيات',
        description: 'Software and application issues',
        applies_to: ['incident', 'problem', 'change'],
        subcategories: [
          { subcategory_id: 'SUB-004', name: 'Operating System', name_ar: 'نظام التشغيل', is_active: true },
          { subcategory_id: 'SUB-005', name: 'Office Applications', name_ar: 'تطبيقات المكتب', is_active: true },
          { subcategory_id: 'SUB-006', name: 'Business Applications', name_ar: 'تطبيقات الأعمال', is_active: true },
        ],
        order: 2,
        is_active: true,
      },
      {
        category_id: 'CAT-2025-00003',
        name: 'Network',
        name_ar: 'الشبكة',
        description: 'Network and connectivity issues',
        applies_to: ['incident', 'problem', 'change'],
        subcategories: [
          { subcategory_id: 'SUB-007', name: 'Internet', name_ar: 'الإنترنت', is_active: true },
          { subcategory_id: 'SUB-008', name: 'VPN', name_ar: 'الشبكة الخاصة', is_active: true },
          { subcategory_id: 'SUB-009', name: 'WiFi', name_ar: 'الواي فاي', is_active: true },
        ],
        order: 3,
        is_active: true,
      },
      {
        category_id: 'CAT-2025-00004',
        name: 'Email',
        name_ar: 'البريد الإلكتروني',
        description: 'Email and communication issues',
        applies_to: ['incident', 'problem'],
        order: 4,
        is_active: true,
      },
    ]);
    console.log(`Created ${categories.length} categories`);

    // Create SLAs
    const slas = await SLA.create([
      {
        sla_id: 'SLA-2025-00001',
        name: 'Critical SLA',
        name_ar: 'اتفاقية الخدمة الحرجة',
        description: 'SLA for critical priority incidents requiring immediate attention',
        priority: Priority.CRITICAL,
        response_time: { hours: 0.5, business_hours_only: false },
        resolution_time: { hours: 4, business_hours_only: false },
        escalation_matrix: [
          { level: 1, after_minutes: 30, notify_role: 'team_lead', notify_users: [] },
          { level: 2, after_minutes: 60, notify_role: 'manager', notify_users: [] },
          { level: 3, after_minutes: 120, notify_role: 'admin', notify_users: [] },
        ],
        is_default: true,
        is_active: true,
      },
      {
        sla_id: 'SLA-2025-00002',
        name: 'High Priority SLA',
        name_ar: 'اتفاقية الخدمة عالية الأولوية',
        description: 'SLA for high priority incidents',
        priority: Priority.HIGH,
        response_time: { hours: 2, business_hours_only: true },
        resolution_time: { hours: 8, business_hours_only: true },
        escalation_matrix: [
          { level: 1, after_minutes: 120, notify_role: 'team_lead', notify_users: [] },
          { level: 2, after_minutes: 240, notify_role: 'manager', notify_users: [] },
        ],
        is_default: true,
        is_active: true,
      },
      {
        sla_id: 'SLA-2025-00003',
        name: 'Medium Priority SLA',
        name_ar: 'اتفاقية الخدمة متوسطة الأولوية',
        description: 'SLA for medium priority incidents',
        priority: Priority.MEDIUM,
        response_time: { hours: 4, business_hours_only: true },
        resolution_time: { hours: 24, business_hours_only: true },
        escalation_matrix: [
          { level: 1, after_minutes: 480, notify_role: 'team_lead', notify_users: [] },
        ],
        is_default: true,
        is_active: true,
      },
      {
        sla_id: 'SLA-2025-00004',
        name: 'Low Priority SLA',
        name_ar: 'اتفاقية الخدمة منخفضة الأولوية',
        description: 'SLA for low priority incidents',
        priority: Priority.LOW,
        response_time: { hours: 8, business_hours_only: true },
        resolution_time: { hours: 72, business_hours_only: true },
        escalation_matrix: [],
        is_default: true,
        is_active: true,
      },
    ]);
    console.log(`Created ${slas.length} SLAs`);

    // Create Sample Incidents
    const now = new Date();
    const incidents = await Incident.create([
      {
        incident_id: 'INC-2025-00001',
        title: 'Email not working for Finance department',
        description: 'Multiple users in Finance department cannot send or receive emails since this morning.',
        status: IncidentStatus.OPEN,
        priority: Priority.HIGH,
        impact: Impact.HIGH,
        urgency: Urgency.HIGH,
        category_id: 'CAT-2025-00004',
        requester: {
          id: 'user-001',
          name: 'Ahmed Al-Rashid',
          email: 'ahmed@company.com',
          department: 'Finance',
          phone: '+966-50-1234567',
        },
        channel: Channel.PHONE,
        sla: {
          sla_id: 'SLA-2025-00002',
          response_due: new Date(now.getTime() + 2 * 60 * 60 * 1000),
          resolution_due: new Date(now.getTime() + 8 * 60 * 60 * 1000),
          breach_flag: false,
          escalation_level: 0,
        },
        site_id: 'SITE-2025-00001',
        is_major: true,
        reopen_count: 0,
        timeline: [{ event: 'Incident Created', by: 'user-001', by_name: 'Ahmed Al-Rashid', time: now }],
      },
      {
        incident_id: 'INC-2025-00002',
        title: 'Laptop screen flickering',
        description: 'My laptop screen keeps flickering intermittently.',
        status: IncidentStatus.IN_PROGRESS,
        priority: Priority.MEDIUM,
        impact: Impact.LOW,
        urgency: Urgency.MEDIUM,
        category_id: 'CAT-2025-00001',
        subcategory_id: 'SUB-002',
        requester: {
          id: 'user-002',
          name: 'Sara Mohammed',
          email: 'sara@company.com',
          department: 'HR',
        },
        channel: Channel.SELF_SERVICE,
        assigned_to: {
          technician_id: 'tech-001',
          name: 'Mohammed Ali',
          email: 'mali@company.com',
          group_name: 'Desktop Support',
        },
        sla: {
          sla_id: 'SLA-2025-00003',
          response_due: new Date(now.getTime() - 1 * 60 * 60 * 1000),
          resolution_due: new Date(now.getTime() + 20 * 60 * 60 * 1000),
          response_met: true,
          response_at: new Date(now.getTime() - 2 * 60 * 60 * 1000),
          breach_flag: false,
          escalation_level: 0,
        },
        site_id: 'SITE-2025-00001',
        is_major: false,
        reopen_count: 0,
        first_response_at: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        worklogs: [
          {
            log_id: 'WL-001',
            by: 'tech-001',
            by_name: 'Mohammed Ali',
            minutes_spent: 30,
            note: 'Checked display drivers, updating to latest version',
            is_internal: false,
            created_at: new Date(now.getTime() - 1 * 60 * 60 * 1000),
          },
        ],
        timeline: [
          { event: 'Incident Created', by: 'user-002', by_name: 'Sara Mohammed', time: new Date(now.getTime() - 3 * 60 * 60 * 1000) },
          { event: 'Assigned to Mohammed Ali', by: 'system', time: new Date(now.getTime() - 2 * 60 * 60 * 1000) },
        ],
      },
      {
        incident_id: 'INC-2025-00003',
        title: 'Cannot connect to VPN',
        description: 'Getting authentication error when trying to connect to corporate VPN from home.',
        status: IncidentStatus.PENDING,
        priority: Priority.MEDIUM,
        impact: Impact.MEDIUM,
        urgency: Urgency.MEDIUM,
        category_id: 'CAT-2025-00003',
        subcategory_id: 'SUB-008',
        requester: {
          id: 'user-003',
          name: 'Khalid Ibrahim',
          email: 'khalid@company.com',
          department: 'IT',
        },
        channel: Channel.EMAIL,
        assigned_to: {
          technician_id: 'tech-002',
          name: 'Fatima Hassan',
          email: 'fhassan@company.com',
          group_name: 'Network Team',
        },
        sla: {
          sla_id: 'SLA-2025-00003',
          response_due: new Date(now.getTime() - 2 * 60 * 60 * 1000),
          resolution_due: new Date(now.getTime() + 18 * 60 * 60 * 1000),
          response_met: true,
          breach_flag: false,
          escalation_level: 0,
          paused_at: now,
        },
        site_id: 'SITE-2025-00002',
        is_major: false,
        reopen_count: 0,
        timeline: [
          { event: 'Incident Created', by: 'user-003', time: new Date(now.getTime() - 4 * 60 * 60 * 1000) },
          { event: 'Status changed to Pending - waiting for user response', by: 'tech-002', time: now },
        ],
      },
      {
        incident_id: 'INC-2025-00004',
        title: 'Printer paper jam',
        description: 'Printer on 3rd floor keeps jamming',
        status: IncidentStatus.RESOLVED,
        priority: Priority.LOW,
        impact: Impact.LOW,
        urgency: Urgency.LOW,
        category_id: 'CAT-2025-00001',
        subcategory_id: 'SUB-003',
        requester: {
          id: 'user-004',
          name: 'Nora Abdullah',
          email: 'nora@company.com',
          department: 'Marketing',
        },
        channel: Channel.WALK_IN,
        assigned_to: {
          technician_id: 'tech-001',
          name: 'Mohammed Ali',
          email: 'mali@company.com',
        },
        sla: {
          sla_id: 'SLA-2025-00004',
          response_due: new Date(now.getTime() - 24 * 60 * 60 * 1000),
          resolution_due: new Date(now.getTime() - 12 * 60 * 60 * 1000),
          response_met: true,
          resolution_met: true,
          resolved_at: new Date(now.getTime() - 14 * 60 * 60 * 1000),
          breach_flag: false,
          escalation_level: 0,
        },
        resolution: {
          code: 'FIXED',
          notes: 'Cleared paper jam and cleaned rollers. Printer working normally now.',
          resolved_by: 'tech-001',
          resolved_by_name: 'Mohammed Ali',
          resolved_at: new Date(now.getTime() - 14 * 60 * 60 * 1000),
        },
        site_id: 'SITE-2025-00001',
        is_major: false,
        reopen_count: 0,
      },
    ]);
    console.log(`Created ${incidents.length} incidents`);

    // Create Sample Problems
    const problems = await Problem.create([
      {
        problem_id: 'PRB-2025-00001',
        title: 'Recurring email delivery delays',
        description: 'Multiple incidents reported about email delays. Investigating root cause.',
        status: ProblemStatus.RCA_IN_PROGRESS,
        priority: Priority.HIGH,
        impact: Impact.HIGH,
        category_id: 'CAT-2025-00004',
        owner: {
          id: 'tech-003',
          name: 'Omar Saeed',
          email: 'osaeed@company.com',
        },
        linked_incidents: ['INC-2025-00001'],
        root_cause: 'Investigating mail server configuration and network latency',
        site_id: 'SITE-2025-00001',
        affected_services: ['Email Service'],
        timeline: [
          { event: 'Problem Created', by: 'tech-003', by_name: 'Omar Saeed', time: now },
        ],
      },
      {
        problem_id: 'PRB-2025-00002',
        title: 'VPN connection timeouts',
        description: 'Users experiencing frequent VPN disconnections',
        status: ProblemStatus.KNOWN_ERROR,
        priority: Priority.MEDIUM,
        impact: Impact.MEDIUM,
        category_id: 'CAT-2025-00003',
        subcategory_id: 'SUB-008',
        owner: {
          id: 'tech-002',
          name: 'Fatima Hassan',
          email: 'fhassan@company.com',
        },
        linked_incidents: ['INC-2025-00003'],
        root_cause: 'VPN concentrator reaching capacity during peak hours',
        workaround: 'Users can reconnect or try connecting during off-peak hours',
        known_error: {
          ke_id: 'KE-001',
          title: 'VPN Capacity Issue',
          symptoms: 'VPN disconnects after 30 minutes, authentication timeouts',
          root_cause: 'VPN concentrator capacity limit',
          workaround: 'Reconnect or use off-peak hours',
          documented_at: now,
          documented_by: 'tech-002',
        },
        site_id: 'SITE-2025-00001',
        affected_services: ['VPN Service'],
        timeline: [
          { event: 'Problem Created', by: 'tech-002', time: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
          { event: 'Marked as Known Error', by: 'tech-002', time: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) },
        ],
      },
    ]);
    console.log(`Created ${problems.length} problems`);

    // Create Sample Changes
    const changes = await Change.create([
      {
        change_id: 'CHG-2025-00001',
        type: ChangeType.NORMAL,
        title: 'Upgrade VPN concentrator capacity',
        description: 'Upgrade VPN infrastructure to handle increased remote work demand',
        status: ChangeStatus.CAB_REVIEW,
        priority: Priority.HIGH,
        impact: Impact.MEDIUM,
        risk: RiskLevel.MEDIUM,
        risk_assessment: 'Medium risk - requires maintenance window, potential brief service interruption',
        requested_by: {
          id: 'tech-002',
          name: 'Fatima Hassan',
          email: 'fhassan@company.com',
          department: 'IT Infrastructure',
        },
        implementation_plan: '1. Backup current config\n2. Install new hardware\n3. Migrate settings\n4. Test connectivity\n5. Switch traffic',
        rollback_plan: 'Restore backup config and revert to old hardware if issues occur',
        test_plan: 'Test VPN connectivity from multiple locations with different user profiles',
        cab_required: true,
        approval: {
          cab_status: ApprovalStatus.PENDING,
          required_approvers: 2,
          current_approvers: 0,
          members: [
            { member_id: 'mgr-001', name: 'IT Manager', role: 'IT Manager', decision: ApprovalStatus.PENDING },
            { member_id: 'mgr-002', name: 'Security Officer', role: 'Security', decision: ApprovalStatus.PENDING },
          ],
        },
        schedule: {
          planned_start: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          planned_end: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
          maintenance_window: 'Weekend',
        },
        linked_problems: ['PRB-2025-00002'],
        affected_services: ['VPN Service'],
        site_id: 'SITE-2025-00001',
        reason_for_change: 'Address VPN capacity issues causing user disconnections',
        business_justification: 'Improve remote work experience and productivity',
        timeline: [
          { event: 'Change Created', by: 'tech-002', by_name: 'Fatima Hassan', time: now },
          { event: 'Submitted for CAB Review', by: 'tech-002', time: now },
        ],
      },
      {
        change_id: 'CHG-2025-00002',
        type: ChangeType.STANDARD,
        title: 'Monthly security patches deployment',
        description: 'Deploy monthly Windows security patches to all workstations',
        status: ChangeStatus.SCHEDULED,
        priority: Priority.MEDIUM,
        impact: Impact.LOW,
        risk: RiskLevel.LOW,
        risk_assessment: 'Low risk - standard monthly procedure with proven rollback',
        requested_by: {
          id: 'tech-004',
          name: 'Ali Hassan',
          email: 'ahassan@company.com',
          department: 'IT Security',
        },
        implementation_plan: '1. Deploy patches via WSUS\n2. Monitor deployment status\n3. Verify critical systems',
        rollback_plan: 'Uninstall patches via WSUS if critical issues reported',
        cab_required: false,
        approval: {
          cab_status: ApprovalStatus.APPROVED,
          required_approvers: 0,
          current_approvers: 0,
          members: [],
          approved_at: now,
        },
        schedule: {
          planned_start: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
          planned_end: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000),
        },
        affected_services: ['All Workstations'],
        site_id: 'SITE-2025-00001',
        reason_for_change: 'Monthly security compliance requirement',
        timeline: [
          { event: 'Change Created', by: 'tech-004', time: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) },
          { event: 'Auto-approved (Standard Change)', by: 'system', time: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) },
          { event: 'Change Scheduled', by: 'tech-004', time: now },
        ],
      },
    ]);
    console.log(`Created ${changes.length} changes`);

    console.log('\n✅ ITSM Seed data created successfully!');
    console.log('\nSummary:');
    console.log(`- Sites: ${sites.length}`);
    console.log(`- Categories: ${categories.length}`);
    console.log(`- SLAs: ${slas.length}`);
    console.log(`- Incidents: ${incidents.length}`);
    console.log(`- Problems: ${problems.length}`);
    console.log(`- Changes: ${changes.length}`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedData();
