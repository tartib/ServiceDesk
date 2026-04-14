'use strict';
const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI;
if (!uri) { console.error('MONGODB_URI not set'); process.exit(1); }

async function main() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  const admin = await db.collection('users').findOne({ email: 'admin@servicedesk.com' });
  if (!admin) { console.error('Admin user not found'); process.exit(1); }

  const orgId = admin.organizations && admin.organizations.length > 0
    ? admin.organizations[0].organizationId.toString()
    : null;

  if (!orgId) { console.error('Admin has no organizations'); process.exit(1); }

  console.log('Admin primary org:', orgId);

  // ── 1. Ensure org document exists ──────────────────────────
  const existingOrg = await db.collection('organizations').findOne({ _id: new mongoose.Types.ObjectId(orgId) });
  if (!existingOrg) {
    await db.collection('organizations').insertOne({
      _id: new mongoose.Types.ObjectId(orgId),
      name: 'ServiceDesk Org',
      slug: 'servicedesk-org',
      createdBy: admin._id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log('Created org document for', orgId);
  } else {
    console.log('Org exists:', existingOrg.name);
  }

  // ── 2. Add all users to org ─────────────────────────────────
  const orgObjectId = new mongoose.Types.ObjectId(orgId);
  const users = await db.collection('users').find({}).toArray();
  for (const user of users) {
    const orgs = user.organizations || [];
    const already = orgs.some(o => o.organizationId && o.organizationId.toString() === orgId);
    if (!already) {
      await db.collection('users').updateOne(
        { _id: user._id },
        { $push: { organizations: { organizationId: orgObjectId, role: user.role === 'manager' ? 'admin' : 'member', joinedAt: new Date() } } }
      );
      console.log('Added', user.email, 'to org');
    }
  }

  // ── 3. Seed SLA policies ────────────────────────────────────
  const slaPolicies = await db.collection('sla_policies').countDocuments({ tenantId: orgId });
  if (slaPolicies === 0) {
    await db.collection('sla_policies').insertMany([
      {
        tenantId: orgId,
        code: 'P1-CRITICAL',
        name: 'P1 Critical Response',
        entityType: 'incident',
        priority: 1,
        matchConditions: [{ field: 'priority', operator: 'eq', value: 'critical' }],
        goals: [
          { metricKey: 'first_response', targetMinutes: 15, startEvent: 'ticket_created', stopEvent: 'first_response', pauseOnStatuses: [], resumeOnStatuses: [], breachSeverity: 'critical', escalationRules: [] },
          { metricKey: 'resolution', targetMinutes: 240, startEvent: 'ticket_created', stopEvent: 'resolved', pauseOnStatuses: ['pending'], resumeOnStatuses: ['in_progress'], breachSeverity: 'critical', escalationRules: [] },
        ],
        isActive: true,
        createdBy: admin._id.toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        tenantId: orgId,
        code: 'P2-HIGH',
        name: 'P2 High Priority',
        entityType: 'incident',
        priority: 2,
        matchConditions: [{ field: 'priority', operator: 'eq', value: 'high' }],
        goals: [
          { metricKey: 'first_response', targetMinutes: 60, startEvent: 'ticket_created', stopEvent: 'first_response', pauseOnStatuses: [], resumeOnStatuses: [], breachSeverity: 'warning', escalationRules: [] },
          { metricKey: 'resolution', targetMinutes: 480, startEvent: 'ticket_created', stopEvent: 'resolved', pauseOnStatuses: ['pending'], resumeOnStatuses: ['in_progress'], breachSeverity: 'warning', escalationRules: [] },
        ],
        isActive: true,
        createdBy: admin._id.toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        tenantId: orgId,
        code: 'SR-STANDARD',
        name: 'Standard Service Request',
        entityType: 'service_request',
        priority: 10,
        matchConditions: [],
        goals: [
          { metricKey: 'resolution', targetMinutes: 2880, startEvent: 'ticket_created', stopEvent: 'resolved', pauseOnStatuses: ['pending'], resumeOnStatuses: ['in_progress'], breachSeverity: 'warning', escalationRules: [] },
        ],
        isActive: true,
        createdBy: admin._id.toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    console.log('Seeded 3 SLA policies');
  } else {
    console.log('SLA policies already exist:', slaPolicies);
  }

  // ── 4. Seed SLA calendar ────────────────────────────────────
  const calCount = await db.collection('sla_calendars').countDocuments({ tenantId: orgId });
  if (calCount === 0) {
    await db.collection('sla_calendars').insertOne({
      tenantId: orgId,
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
  } else {
    console.log('SLA calendar exists:', calCount);
  }

  // ── 5. Seed incidents ───────────────────────────────────────
  const incCount = await db.collection('incidents').countDocuments({});
  if (incCount === 0) {
    const now = new Date();
    const adminName = admin.name || 'Admin';
    await db.collection('incidents').insertMany([
      { incident_id: 'INC-2025-00001', title: 'Email server down', description: 'Exchange not responding', priority: 'critical', status: 'open', requester: { id: admin._id.toString(), name: adminName, email: admin.email }, assigned_to: { technician_id: admin._id.toString(), name: adminName }, category_id: 'CAT-001', site_id: 'SITE-001', sla: { response_due: new Date(Date.now() + 900000), resolution_due: new Date(Date.now() + 14400000), breach_flag: false }, timeline: [{ event: 'Incident Created', by: admin._id.toString(), by_name: adminName, time: now }], created_at: now, updated_at: now },
      { incident_id: 'INC-2025-00002', title: 'VPN connectivity issue', description: 'Remote users cannot connect', priority: 'high', status: 'in_progress', requester: { id: admin._id.toString(), name: adminName, email: admin.email }, assigned_to: { technician_id: admin._id.toString(), name: adminName }, category_id: 'CAT-001', site_id: 'SITE-001', sla: { response_due: new Date(Date.now() + 3600000), resolution_due: new Date(Date.now() + 28800000), breach_flag: false }, timeline: [{ event: 'Incident Created', by: admin._id.toString(), by_name: adminName, time: now }], created_at: now, updated_at: now },
      { incident_id: 'INC-2025-00003', title: 'Printer offline Floor 3', description: 'Printer unresponsive', priority: 'low', status: 'resolved', requester: { id: admin._id.toString(), name: adminName, email: admin.email }, category_id: 'CAT-002', site_id: 'SITE-001', sla: { response_due: new Date(Date.now() - 7200000), resolution_due: new Date(Date.now() + 86400000), breach_flag: false }, timeline: [{ event: 'Incident Created', by: admin._id.toString(), by_name: adminName, time: now }], created_at: now, updated_at: now },
      { incident_id: 'INC-2025-00004', title: 'HR portal 500 errors', description: 'HR portal throwing 500s', priority: 'high', status: 'open', requester: { id: admin._id.toString(), name: adminName, email: admin.email }, category_id: 'CAT-003', site_id: 'SITE-001', sla: { response_due: new Date(Date.now() + 1800000), resolution_due: new Date(Date.now() + 21600000), breach_flag: false }, timeline: [{ event: 'Incident Created', by: admin._id.toString(), by_name: adminName, time: now }], created_at: now, updated_at: now },
      { incident_id: 'INC-2025-00005', title: 'Slow network floor 2', description: 'Network degraded', priority: 'medium', status: 'open', requester: { id: admin._id.toString(), name: adminName, email: admin.email }, category_id: 'CAT-001', site_id: 'SITE-001', sla: { response_due: new Date(Date.now() + 7200000), resolution_due: new Date(Date.now() + 43200000), breach_flag: false }, timeline: [{ event: 'Incident Created', by: admin._id.toString(), by_name: adminName, time: now }], created_at: now, updated_at: now },
    ]);
    console.log('Seeded 5 incidents');
  } else {
    console.log('Incidents already exist:', incCount);
  }

  // ── 6. Seed changes ─────────────────────────────────────────
  const chgCount = await db.collection('changes').countDocuments({});
  if (chgCount === 0) {
    const now = new Date();
    const adminName = admin.name || 'Admin';
    await db.collection('changes').insertMany([
      { change_id: 'CHG-2025-00001', title: 'Upgrade firewall firmware', description: 'Scheduled upgrade to v12.3', type: 'normal', priority: 'medium', status: 'pending', requester: { id: admin._id.toString(), name: adminName }, category_id: 'CAT-001', site_id: 'SITE-001', timeline: [{ event: 'Change Created', by: admin._id.toString(), by_name: adminName, time: now }], created_at: now, updated_at: now },
      { change_id: 'CHG-2025-00002', title: 'Deploy new HR portal', description: 'HR system go-live', type: 'major', priority: 'high', status: 'approved', requester: { id: admin._id.toString(), name: adminName }, category_id: 'CAT-001', site_id: 'SITE-001', timeline: [{ event: 'Change Created', by: admin._id.toString(), by_name: adminName, time: now }], created_at: now, updated_at: now },
      { change_id: 'CHG-2025-00003', title: 'SSL certificate renewal', description: 'Renew expiring certs', type: 'standard', priority: 'low', status: 'completed', requester: { id: admin._id.toString(), name: adminName }, category_id: 'CAT-001', site_id: 'SITE-001', timeline: [{ event: 'Change Created', by: admin._id.toString(), by_name: adminName, time: now }], created_at: now, updated_at: now },
    ]);
    console.log('Seeded 3 changes');
  } else {
    console.log('Changes already exist:', chgCount);
  }

  console.log('\n=== Done. Org ID:', orgId, '===');
  await mongoose.disconnect();
}

main().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
