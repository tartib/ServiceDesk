/// <reference types="jest" />
import request from 'supertest';
import app from '../../app';
import { setupTestDB } from '../helpers/testSetup';
import { seedUser, authReq, TestUser } from '../helpers/authHelper';

/**
 * Integration Tests — Unified Team Management API
 * Covers: CRUD, members, bulk, transfer-lead, audit-log, queue
 */

setupTestDB({ dropAfterEach: false });

let manager: TestUser;
let supervisor: TestUser;
let prepUser: TestUser;
let secondUser: TestUser;

let teamId: string;
let queueId: string;

beforeAll(async () => {
  [manager, supervisor, prepUser, secondUser] = await Promise.all([
    seedUser({ email: 'manager@teams.test', role: 'manager', itsmRole: 'admin' }),
    seedUser({ email: 'supervisor@teams.test', role: 'supervisor', itsmRole: 'team_lead' }),
    seedUser({ email: 'prep@teams.test', role: 'prep', itsmRole: 'end_user' }),
    seedUser({ email: 'second@teams.test', role: 'prep', itsmRole: 'end_user' }),
  ]);
});

// ── CREATE ─────────────────────────────────────────────────────────────────

describe('POST /api/v1/teams — Create Team', () => {
  it('403 — prep user cannot create a team', async () => {
    const res = await authReq(request(app).post('/api/v1/teams'), prepUser)
      .send({ name: 'Blocked Team', name_ar: 'فريق محجوب' });
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('400 — missing required name', async () => {
    const res = await authReq(request(app).post('/api/v1/teams'), manager)
      .send({ name_ar: 'فريق بدون اسم' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('201 — manager creates a team', async () => {
    const res = await authReq(request(app).post('/api/v1/teams'), manager)
      .send({
        name: 'Support Team Alpha',
        name_ar: 'فريق الدعم ألفا',
        type: 'support',
        scope: 'global',
        visibility: 'public',
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Support Team Alpha');
    expect(res.body.data.scope).toBe('global');
    expect(res.body.data.visibility).toBe('public');
    teamId = res.body.data._id;
  });

  it('201 — supervisor can also create a team', async () => {
    const res = await authReq(request(app).post('/api/v1/teams'), supervisor)
      .send({ name: 'Ops Team Beta', name_ar: 'فريق العمليات بيتا', type: 'operations' });
    expect(res.status).toBe(201);
    expect(res.body.data.type).toBe('operations');
  });
});

// ── READ ───────────────────────────────────────────────────────────────────

describe('GET /api/v1/teams — List Teams', () => {
  it('200 — returns team list', async () => {
    const res = await authReq(request(app).get('/api/v1/teams'), prepUser);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('200 — filters by type', async () => {
    const res = await authReq(request(app).get('/api/v1/teams?type=support'), prepUser);
    expect(res.status).toBe(200);
    expect(res.body.data.every((t: any) => t.type === 'support')).toBe(true);
  });

  it('200 — search by name', async () => {
    const res = await authReq(request(app).get('/api/v1/teams?search=Alpha'), prepUser);
    expect(res.status).toBe(200);
    expect(res.body.data.some((t: any) => t.name.includes('Alpha'))).toBe(true);
  });
});

describe('GET /api/v1/teams/:id — Get Team', () => {
  it('200 — returns team by id', async () => {
    const res = await authReq(request(app).get(`/api/v1/teams/${teamId}`), prepUser);
    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(teamId);
  });

  it('404 — unknown id', async () => {
    const res = await authReq(request(app).get('/api/v1/teams/000000000000000000000000'), prepUser);
    expect(res.status).toBe(404);
  });
});

// ── UPDATE ─────────────────────────────────────────────────────────────────

describe('PUT /api/v1/teams/:id — Update Team', () => {
  it('200 — updates name and visibility', async () => {
    const res = await authReq(request(app).put(`/api/v1/teams/${teamId}`), manager)
      .send({ name: 'Support Team Alpha Updated', visibility: 'organization' });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Support Team Alpha Updated');
    expect(res.body.data.visibility).toBe('organization');
  });

  it('200 — updates capacity', async () => {
    const res = await authReq(request(app).put(`/api/v1/teams/${teamId}`), manager)
      .send({ capacity: { default_hours_per_week: 32, sprint_length_days: 10, working_days: [1, 2, 3, 4] } });
    expect(res.status).toBe(200);
    expect(res.body.data.capacity.default_hours_per_week).toBe(32);
  });
});

// ── MEMBERS ────────────────────────────────────────────────────────────────

describe('POST /api/v1/teams/:id/members — Add Member', () => {
  it('400 — missing user_id', async () => {
    const res = await authReq(request(app).post(`/api/v1/teams/${teamId}/members`), manager)
      .send({ role: 'member' });
    expect(res.status).toBe(400);
  });

  it('200 — adds prep user as member', async () => {
    const res = await authReq(request(app).post(`/api/v1/teams/${teamId}/members`), manager)
      .send({ user_id: prepUser.id, role: 'member' });
    expect(res.status).toBe(200);
    expect(res.body.data.members.some((m: any) => m.user_id._id === prepUser.id || m.user_id === prepUser.id)).toBe(true);
  });

  it('400 — duplicate member', async () => {
    const res = await authReq(request(app).post(`/api/v1/teams/${teamId}/members`), manager)
      .send({ user_id: prepUser.id, role: 'member' });
    expect(res.status).toBe(400);
  });

  it('200 — adds second user as maintainer', async () => {
    const res = await authReq(request(app).post(`/api/v1/teams/${teamId}/members`), manager)
      .send({ user_id: secondUser.id, role: 'maintainer' });
    expect(res.status).toBe(200);
  });
});

describe('GET /api/v1/teams/:id/members', () => {
  it('200 — returns member list', async () => {
    const res = await authReq(request(app).get(`/api/v1/teams/${teamId}/members`), prepUser);
    expect(res.status).toBe(200);
    expect(res.body.count).toBeGreaterThanOrEqual(2);
  });
});

describe('PATCH /api/v1/teams/:id/members/:userId — Update Role', () => {
  it('400 — invalid role value', async () => {
    const res = await authReq(request(app).patch(`/api/v1/teams/${teamId}/members/${prepUser.id}`), manager)
      .send({ role: 'superuser' });
    expect(res.status).toBe(400);
  });

  it('200 — changes member role to observer', async () => {
    const res = await authReq(request(app).patch(`/api/v1/teams/${teamId}/members/${prepUser.id}`), manager)
      .send({ role: 'observer' });
    expect(res.status).toBe(200);
    const updated = res.body.data.members.find(
      (m: any) => (m.user_id._id || m.user_id) === prepUser.id
    );
    expect(updated?.role).toBe('observer');
  });
});

// ── BULK MEMBERS ───────────────────────────────────────────────────────────

describe('POST /api/v1/teams/:id/members/bulk', () => {
  it('200 — removes a member in bulk', async () => {
    const res = await authReq(request(app).post(`/api/v1/teams/${teamId}/members/bulk`), manager)
      .send({ remove: [prepUser.id] });
    expect(res.status).toBe(200);
    expect(res.body.summary.removed).toBe(1);
    expect(res.body.summary.errors).toHaveLength(0);
  });

  it('200 — re-adds and adds another member in bulk', async () => {
    const res = await authReq(request(app).post(`/api/v1/teams/${teamId}/members/bulk`), manager)
      .send({ add: [{ user_id: prepUser.id, role: 'member' }] });
    expect(res.status).toBe(200);
    expect(res.body.summary.added).toBe(1);
  });

  it('200 — reports errors for duplicate without failing entire batch', async () => {
    const res = await authReq(request(app).post(`/api/v1/teams/${teamId}/members/bulk`), manager)
      .send({ add: [{ user_id: prepUser.id, role: 'member' }] });
    expect(res.status).toBe(200);
    expect(res.body.summary.errors.length).toBeGreaterThan(0);
  });
});

// ── TRANSFER LEAD ──────────────────────────────────────────────────────────

describe('PATCH /api/v1/teams/:id/transfer-lead', () => {
  it('400 — missing new_leader_id', async () => {
    const res = await authReq(request(app).patch(`/api/v1/teams/${teamId}/transfer-lead`), manager)
      .send({});
    expect(res.status).toBe(400);
  });

  it('400 — new leader must be a current member', async () => {
    const nonMember = await seedUser({ email: 'nonmember@teams.test', role: 'prep' });
    const res = await authReq(request(app).patch(`/api/v1/teams/${teamId}/transfer-lead`), manager)
      .send({ new_leader_id: nonMember.id });
    expect(res.status).toBe(400);
  });

  it('200 — transfers lead to existing member', async () => {
    const res = await authReq(request(app).patch(`/api/v1/teams/${teamId}/transfer-lead`), manager)
      .send({ new_leader_id: prepUser.id });
    expect(res.status).toBe(200);
    const newLeader = res.body.data.members.find(
      (m: any) => (m.user_id._id || m.user_id) === prepUser.id
    );
    expect(newLeader?.role).toBe('leader');
    expect(res.body.data.leader_id).toBeDefined();
  });
});

// ── AUDIT LOG ──────────────────────────────────────────────────────────────

describe('GET /api/v1/teams/:id/audit-log', () => {
  it('200 — returns paginated audit log', async () => {
    const res = await authReq(request(app).get(`/api/v1/teams/${teamId}/audit-log?page=1&limit=10`), manager);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('200 — audit log contains team_created entry', async () => {
    const res = await authReq(request(app).get(`/api/v1/teams/${teamId}/audit-log`), manager);
    const actions = res.body.data.map((e: any) => e.action);
    expect(actions).toContain('team_created');
  });

  it('200 — audit log contains member_added entries', async () => {
    const res = await authReq(request(app).get(`/api/v1/teams/${teamId}/audit-log`), manager);
    const actions = res.body.data.map((e: any) => e.action);
    expect(actions).toContain('member_added');
  });

  it('404 — unknown team', async () => {
    const res = await authReq(request(app).get('/api/v1/teams/000000000000000000000000/audit-log'), manager);
    expect(res.status).toBe(404);
  });
});

// ── QUEUE ──────────────────────────────────────────────────────────────────

describe('POST /api/v1/teams/:id/queue — Create Queue', () => {
  it('400 — missing queue name', async () => {
    const res = await authReq(request(app).post(`/api/v1/teams/${teamId}/queue`), manager)
      .send({ ticket_types: ['incident'] });
    expect(res.status).toBe(400);
  });

  it('201 — creates default queue', async () => {
    const res = await authReq(request(app).post(`/api/v1/teams/${teamId}/queue`), manager)
      .send({
        name: 'Main Inbox',
        name_ar: 'صندوق الوارد الرئيسي',
        ticket_types: ['incident', 'service_request'],
        is_default: true,
      });
    expect(res.status).toBe(201);
    expect(res.body.data.is_default).toBe(true);
    expect(res.body.data.name).toBe('Main Inbox');
    queueId = res.body.data._id;
  });

  it('201 — second queue is not default', async () => {
    const res = await authReq(request(app).post(`/api/v1/teams/${teamId}/queue`), manager)
      .send({ name: 'Overflow Queue', name_ar: 'طابور الفائض', is_default: false });
    expect(res.status).toBe(201);
    expect(res.body.data.is_default).toBe(false);
  });
});

describe('GET /api/v1/teams/:id/queue — List Queues', () => {
  it('200 — returns active queues', async () => {
    const res = await authReq(request(app).get(`/api/v1/teams/${teamId}/queue`), prepUser);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });
});

describe('PUT /api/v1/teams/:id/queue/:queueId — Update Queue', () => {
  it('200 — updates queue ticket_types', async () => {
    const res = await authReq(request(app).put(`/api/v1/teams/${teamId}/queue/${queueId}`), manager)
      .send({ ticket_types: ['incident', 'change', 'problem'] });
    expect(res.status).toBe(200);
    expect(res.body.data.ticket_types).toContain('change');
  });

  it('200 — deactivates queue', async () => {
    const res = await authReq(request(app).put(`/api/v1/teams/${teamId}/queue/${queueId}`), manager)
      .send({ is_active: false });
    expect(res.status).toBe(200);
    expect(res.body.data.is_active).toBe(false);
  });

  it('404 — wrong team for queue', async () => {
    const res = await authReq(
      request(app).put(`/api/v1/teams/000000000000000000000000/queue/${queueId}`), manager
    ).send({ name: 'X' });
    expect(res.status).toBe(404);
  });
});

// ── DELETE ─────────────────────────────────────────────────────────────────

describe('DELETE /api/v1/teams/:id — Delete Team', () => {
  it('403 — prep user cannot delete', async () => {
    const res = await authReq(request(app).delete(`/api/v1/teams/${teamId}`), prepUser);
    expect(res.status).toBe(403);
  });

  it('200 — manager deletes team', async () => {
    const res = await authReq(request(app).delete(`/api/v1/teams/${teamId}`), manager);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('404 — already deleted', async () => {
    const res = await authReq(request(app).delete(`/api/v1/teams/${teamId}`), manager);
    expect(res.status).toBe(404);
  });
});
