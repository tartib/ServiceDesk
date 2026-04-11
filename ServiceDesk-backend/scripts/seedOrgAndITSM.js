'use strict';
const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/servicedesk';

async function main() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;

  // ── 1. Ensure organization exists ──────────────────────────
  let org = await db.collection('organizations').findOne({});
  if (!org) {
    const result = await db.collection('organizations').insertOne({
      name: 'ServiceDesk Org',
      slug: 'servicedesk-org',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    org = await db.collection('organizations').findOne({ _id: result.insertedId });
    console.log('Created org:', org._id.toString());
  } else {
    console.log('Using existing org:', org._id.toString(), org.name);
  }

  const orgId = org._id;

  // ── 2. Add all users to org ─────────────────────────────────
  const users = await db.collection('users').find({}).toArray();
  for (const user of users) {
    const orgs = user.organizations || [];
    const already = orgs.some(
      (o) => o.organizationId && o.organizationId.toString() === orgId.toString()
    );
    if (!already) {
      await db.collection('users').updateOne(
        { _id: user._id },
        {
          $push: {
            organizations: {
              organizationId: orgId,
              role: user.role === 'admin' ? 'admin' : 'agent',
              joinedAt: new Date(),
            },
          },
        }
      );
      console.log('Added user', user.email, 'to org');
    } else {
      console.log('User', user.email, 'already in org');
    }
  }

  // ── 3. Find admin user for createdBy ───────────────────────
  const adminUser = await db.collection('users').findOne({ email: 'admin@servicedesk.com' });
  const adminId = adminUser ? adminUser._id : users[0]._id;

  // ── 4. Seed SLA policies ────────────────────────────────────
  const slaPolicies = await db.collection('sla_policies').countDocuments({ tenantId: orgId.toString() });
  if (slaPolicies === 0) {
    await db.collection('sla_policies').insertMany([
      {
        tenantId: orgId.toString(),
        code: 'P1-CRITICAL',
        name: 'P1 Critical Response',
        entityType: 'incident',
        priority: 1,
        matchConditions: [{ field: 'priority', operator: 'eq', value: 'critical' }],
        goals: [
          {
            metricKey: 'first_response',
            targetMinutes: 15,
            startEvent: 'ticket_created',
            stopEvent: 'first_response',
            pauseOnStatuses: [],
            resumeOnStatuses: [],
            breachSeverity: 'critical',
            escalationRules: [],
          },
          {
            metricKey: 'resolution',
            targetMinutes: 240,
            startEvent: 'ticket_created',
            stopEvent: 'resolved',
            pauseOnStatuses: ['pending'],
            resumeOnStatuses: ['in_progress'],
            breachSeverity: 'critical',
            escalationRules: [],
          },
        ],
        isActive: true,
        createdBy: adminId.toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        tenantId: orgId.toString(),
        code: 'P2-HIGH',
        name: 'P2 High Priority',
        entityType: 'incident',
        priority: 2,
        matchConditions: [{ field: 'priority', operator: 'eq', value: 'high' }],
        goals: [
          {
            metricKey: 'first_response',
            targetMinutes: 60,
            startEvent: 'ticket_created',
            stopEvent: 'first_response',
            pauseOnStatuses: [],
            resumeOnStatuses: [],
            breachSeverity: 'warning',
            escalationRules: [],
          },
          {
            metricKey: 'resolution',
            targetMinutes: 480,
            startEvent: 'ticket_created',
            stopEvent: 'resolved',
            pauseOnStatuses: ['pending'],
            resumeOnStatuses: ['in_progress'],
            breachSeverity: 'warning',
            escalationRules: [],
          },
        ],
        isActive: true,
        createdBy: adminId.toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        tenantId: orgId.toString(),
        code: 'SR-STANDARD',
        name: 'Standard Service Request',
        entityType: 'service_request',
        priority: 10,
        matchConditions: [],
        goals: [
          {
            metricKey: 'resolution',
            targetMinutes: 2880,
            startEvent: 'ticket_created',
            stopEvent: 'resolved',
            pauseOnStatuses: ['pending'],
            resumeOnStatuses: ['in_progress'],
            breachSeverity: 'warning',
            escalationRules: [],
          },
        ],
        isActive: true,
        createdBy: adminId.toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    console.log('Seeded 3 SLA policies');
  } else {
    console.log('SLA policies already exist:', slaPolicies);
  }

  // ── 5. Seed SLA calendar ────────────────────────────────────
  const calCount = await db.collection('sla_calendars').countDocuments({ tenantId: orgId.toString() });
  if (calCount === 0) {
    await db.collection('sla_calendars').insertOne({
      tenantId: orgId.toString(),
      name: 'Business Hours',
      timezone: 'Asia/Riyadh',
      isDefault: true,
      isActive: true,
      workingHours: [
        { dayOfWeek: 0, startTime: '08:00', endTime: '17:00', isWorkingDay: false },
        { dayOfWeek: 1, startTime: '08:00', endTime: '17:00', isWorkingDay: true },
        { dayOfWeek: 2, startTime: '08:00', endTime: '17:00', isWorkingDay: true },
        { dayOfWeek: 3, startTime: '08:00', endTime: '17:00', isWorkingDay: true },
        { dayOfWeek: 4, startTime: '08:00', endTime: '17:00', isWorkingDay: true },
        { dayOfWeek: 5, startTime: '08:00', endTime: '17:00', isWorkingDay: true },
        { dayOfWeek: 6, startTime: '08:00', endTime: '17:00', isWorkingDay: false },
      ],
      holidays: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log('Seeded default SLA calendar');
  }

  // ── 6. Seed sample incidents ────────────────────────────────
  const incCount = await db.collection('incidents').countDocuments({});
  if (incCount === 0) {
    const now = new Date();
    const adminEmail = adminUser ? adminUser.email : 'admin@servicedesk.com';
    const adminName = adminUser ? (adminUser.name || 'Admin') : 'Admin';
    const incidents = [
      {
        incident_id: 'INC-2025-00001',
        title: 'Email server down',
        description: 'Exchange server is not responding for all users',
        priority: 'critical',
        status: 'open',
        requester: { id: adminId.toString(), name: adminName, email: adminEmail },
        assigned_to: { technician_id: adminId.toString(), name: adminName },
        category_id: 'CAT-001',
        site_id: 'SITE-001',
        sla: { response_due: new Date(Date.now() + 15 * 60000), resolution_due: new Date(Date.now() + 4 * 3600000), breach_flag: false },
        timeline: [{ event: 'Incident Created', by: adminId.toString(), by_name: adminName, time: now }],
        created_at: now, updated_at: now,
      },
      {
        incident_id: 'INC-2025-00002',
        title: 'VPN connectivity issue',
        description: 'Remote users cannot connect to corporate VPN',
        priority: 'high',
        status: 'in_progress',
        requester: { id: adminId.toString(), name: adminName, email: adminEmail },
        assigned_to: { technician_id: adminId.toString(), name: adminName },
        category_id: 'CAT-001',
        site_id: 'SITE-001',
        sla: { response_due: new Date(Date.now() + 60 * 60000), resolution_due: new Date(Date.now() + 8 * 3600000), breach_flag: false },
        timeline: [{ event: 'Incident Created', by: adminId.toString(), by_name: adminName, time: now }],
        created_at: now, updated_at: now,
      },
      {
        incident_id: 'INC-2025-00003',
        title: 'Printer offline - Floor 3',
        description: 'The printer on floor 3 is offline and unresponsive',
        priority: 'low',
        status: 'resolved',
        requester: { id: adminId.toString(), name: adminName, email: adminEmail },
        category_id: 'CAT-002',
        site_id: 'SITE-001',
        sla: { response_due: new Date(Date.now() - 2 * 3600000), resolution_due: new Date(Date.now() + 24 * 3600000), breach_flag: false },
        timeline: [{ event: 'Incident Created', by: adminId.toString(), by_name: adminName, time: now }],
        created_at: now, updated_at: now,
      },
      {
        incident_id: 'INC-2025-00004',
        title: 'Application error 500 on HR portal',
        description: 'HR portal is throwing 500 errors intermittently',
        priority: 'high',
        status: 'open',
        requester: { id: adminId.toString(), name: adminName, email: adminEmail },
        category_id: 'CAT-003',
        site_id: 'SITE-001',
        sla: { response_due: new Date(Date.now() + 30 * 60000), resolution_due: new Date(Date.now() + 6 * 3600000), breach_flag: false },
        timeline: [{ event: 'Incident Created', by: adminId.toString(), by_name: adminName, time: now }],
        created_at: now, updated_at: now,
      },
      {
        incident_id: 'INC-2025-00005',
        title: 'Slow network on floor 2',
        description: 'Network performance is significantly degraded on floor 2',
        priority: 'medium',
        status: 'open',
        requester: { id: adminId.toString(), name: adminName, email: adminEmail },
        category_id: 'CAT-001',
        site_id: 'SITE-001',
        sla: { response_due: new Date(Date.now() + 2 * 3600000), resolution_due: new Date(Date.now() + 12 * 3600000), breach_flag: false },
        timeline: [{ event: 'Incident Created', by: adminId.toString(), by_name: adminName, time: now }],
        created_at: now, updated_at: now,
      },
    ];
    await db.collection('incidents').insertMany(incidents);
    console.log('Seeded', incidents.length, 'incidents');
  } else {
    console.log('Incidents already exist:', incCount);
  }

  // ── 7. Seed sample changes ──────────────────────────────────
  // Find the changes collection schema by checking existing indexes
  const chgIndexes = await db.collection('changes').indexes().catch(() => []);
  const hasChangeId = chgIndexes.some(i => i.key && i.key.change_id !== undefined);
  const chgCount = await db.collection('changes').countDocuments({});
  if (chgCount === 0) {
    const now = new Date();
    const adminName = adminUser ? (adminUser.name || 'Admin') : 'Admin';
    const changeBase = {
      requester: { id: adminId.toString(), name: adminName },
      category_id: 'CAT-001',
      site_id: 'SITE-001',
      timeline: [{ event: 'Change Created', by: adminId.toString(), by_name: adminName, time: now }],
      created_at: now, updated_at: now,
    };
    const changes = [
      { change_id: 'CHG-2025-00001', title: 'Upgrade firewall firmware', description: 'Scheduled upgrade to v12.3', type: 'normal', priority: 'medium', status: 'pending', ...changeBase },
      { change_id: 'CHG-2025-00002', title: 'Deploy new HR portal', description: 'New HR system go-live deployment', type: 'major', priority: 'high', status: 'approved', ...changeBase },
      { change_id: 'CHG-2025-00003', title: 'SSL certificate renewal', description: 'Renew expiring SSL certificates', type: 'standard', priority: 'low', status: 'completed', ...changeBase },
    ];
    await db.collection('changes').insertMany(changes);
    console.log('Seeded', changes.length, 'changes');
  } else {
    console.log('Changes already exist:', chgCount);
  }

  console.log('\n=== Seeding complete ===');
  console.log('Organization ID:', orgId.toString());
  console.log('Use this as X-Organization-Id header or store in localStorage.organizationId');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
