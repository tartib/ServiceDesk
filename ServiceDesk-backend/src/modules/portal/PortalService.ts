/**
 * PortalService — In-memory implementation of IPortalService
 *
 * Issues signed tokens for unauthenticated/external portal access.
 * Replace in-memory stores with DB repos for production use.
 *
 * Token signing: uses crypto.randomBytes (opaque token).
 * For production, replace with JWT or HMAC-signed tokens.
 */

import { randomBytes } from 'crypto';
import type {
  IPortalService,
  IPortalToken,
  IPortalSession,
  IssuePortalTokenDTO,
} from './types';

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${randomBytes(4).toString('hex')}`;
}

function generateToken(): string {
  return randomBytes(32).toString('hex');
}

export class PortalService implements IPortalService {
  private tokens: Map<string, IPortalToken> = new Map();
  private tokenByValue: Map<string, string> = new Map();
  private sessions: Map<string, IPortalSession> = new Map();

  // ── Token management ────────────────────────────────────────────────────────

  async issueToken(dto: IssuePortalTokenDTO, issuedBy: string): Promise<IPortalToken> {
    const ttlMs = (dto.ttlMinutes ?? 60) * 60 * 1000;
    const now = new Date();
    const token: IPortalToken = {
      tokenId: generateId('ptk'),
      token: generateToken(),
      scope: dto.scope,
      resourceType: dto.resourceType,
      resourceId: dto.resourceId,
      organizationId: dto.organizationId,
      siteId: dto.siteId,
      claimedBy: dto.claimedBy,
      issuedBy,
      issuedAt: now,
      expiresAt: new Date(now.getTime() + ttlMs),
      isRevoked: false,
    };
    this.tokens.set(token.tokenId, token);
    this.tokenByValue.set(token.token, token.tokenId);
    return token;
  }

  async validateToken(token: string): Promise<IPortalToken | null> {
    const tokenId = this.tokenByValue.get(token);
    if (!tokenId) return null;
    const record = this.tokens.get(tokenId);
    if (!record) return null;
    if (record.isRevoked) return null;
    if (record.expiresAt < new Date()) return null;
    return record;
  }

  async revokeToken(tokenId: string): Promise<void> {
    const record = this.tokens.get(tokenId);
    if (record) {
      record.isRevoked = true;
    }
  }

  async listTokens(organizationId: string): Promise<IPortalToken[]> {
    return Array.from(this.tokens.values()).filter(
      (t) => t.organizationId === organizationId,
    );
  }

  // ── Session management ─────────────────────────────────────────────────────

  async createSession(token: IPortalToken): Promise<IPortalSession> {
    const now = new Date();
    const session: IPortalSession = {
      sessionId: generateId('pss'),
      tokenId: token.tokenId,
      token: token.token,
      scope: token.scope,
      resourceType: token.resourceType,
      resourceId: token.resourceId,
      organizationId: token.organizationId,
      siteId: token.siteId,
      startedAt: now,
      lastActivityAt: now,
      expiresAt: token.expiresAt,
    };
    this.sessions.set(session.sessionId, session);

    token.usedAt = now;
    return session;
  }

  async getSession(sessionId: string): Promise<IPortalSession | null> {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    if (session.expiresAt < new Date()) return null;
    return session;
  }

  async extendSession(sessionId: string, ttlMinutes = 30): Promise<IPortalSession | null> {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    session.expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
    session.lastActivityAt = new Date();
    return session;
  }
}

export const portalService = new PortalService();
