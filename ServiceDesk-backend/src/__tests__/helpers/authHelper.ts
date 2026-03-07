/**
 * Auth Helper — reusable token factory and user seeding for tests
 */

import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from '../../models/User';
import env from '../../config/env';

export type TestRole = 'prep' | 'supervisor' | 'manager';
export type TestItsmRole = 'end_user' | 'technician' | 'team_lead' | 'manager' | 'cab_member' | 'admin';

export interface SeedUserOptions {
  name?: string;
  email?: string;
  password?: string;
  role?: TestRole;
  itsmRole?: TestItsmRole;
}

export interface TestUser {
  id: string;
  email: string;
  role: TestRole;
  token: string;
  organizationId: string;
}

/** Shared org id so all seeded users belong to the same org */
let sharedOrgId: string | null = null;

function getOrCreateOrgId(): string {
  if (!sharedOrgId) {
    sharedOrgId = new mongoose.Types.ObjectId().toString();
  }
  return sharedOrgId;
}

const defaultUsers: Record<TestRole, SeedUserOptions> = {
  prep: { name: 'Test Prep', email: 'prep@test.com', password: 'Test@1234', role: 'prep', itsmRole: 'end_user' },
  supervisor: { name: 'Test Supervisor', email: 'supervisor@test.com', password: 'Test@1234', role: 'supervisor', itsmRole: 'technician' },
  manager: { name: 'Test Manager', email: 'manager@test.com', password: 'Test@1234', role: 'manager', itsmRole: 'admin' },
};

/**
 * Seed a user and return id + JWT token.
 * Every user is placed in a shared organization so ITSM org-scoped
 * permission checks pass.
 */
export async function seedUser(opts: SeedUserOptions = {}): Promise<TestUser> {
  const data = { ...defaultUsers[opts.role || 'prep'], ...opts };
  const orgId = getOrCreateOrgId();

  const user = await User.create({
    ...data,
    organizations: [
      { organizationId: new mongoose.Types.ObjectId(orgId), role: 'owner', joinedAt: new Date() },
    ],
  });
  const id = user._id.toString();
  const token = jwt.sign(
    { id, userId: id, email: data.email, role: data.role },
    env.JWT_SECRET,
    { expiresIn: '1h' },
  );
  return { id, email: data.email!, role: data.role as TestRole, token, organizationId: orgId };
}

/**
 * Seed the standard three test users (prep, supervisor, manager).
 */
export async function seedAllUsers(): Promise<Record<TestRole, TestUser>> {
  const [prep, supervisor, manager] = await Promise.all([
    seedUser({ role: 'prep' }),
    seedUser({ role: 'supervisor' }),
    seedUser({ role: 'manager' }),
  ]);
  return { prep, supervisor, manager };
}

/**
 * Generate a JWT for an existing user ID.
 */
export function generateToken(userId: string, role: TestRole = 'prep'): string {
  return jwt.sign({ id: userId, userId, role }, env.JWT_SECRET, { expiresIn: '1h' });
}

/**
 * Build an Authorization header value.
 */
export function authHeader(token: string): string {
  return `Bearer ${token}`;
}

/**
 * Apply auth + org headers to a supertest request.
 * Usage: authReq(request(app).get('/path'), user)
 */
export function authReq(req: any, user: TestUser): any {
  return req
    .set('Authorization', `Bearer ${user.token}`)
    .set('X-Organization-Id', user.organizationId);
}
