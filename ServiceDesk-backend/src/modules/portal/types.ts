/**
 * Portal Module — Domain Types (ADR 001 Platform Pillar)
 *
 * The portal module issues short-lived signed tokens that grant
 * unauthenticated (or externally-authenticated) users access to
 * specific self-service forms or record views.
 */

export type PortalTokenScope =
  | 'form:submit'      // can submit a specific form
  | 'record:view'      // can view a specific record
  | 'catalog:browse';  // can browse the service catalog

export interface IPortalToken {
  tokenId: string;
  token: string;
  scope: PortalTokenScope;
  /** The resource the token grants access to */
  resourceType: 'form_definition' | 'record' | 'catalog';
  resourceId?: string;
  organizationId: string;
  siteId?: string;
  /** User identity tied to this token (e.g. email for external submissions) */
  claimedBy?: string;
  issuedBy: string;
  issuedAt: Date;
  expiresAt: Date;
  usedAt?: Date;
  isRevoked: boolean;
}

export interface IPortalSession {
  sessionId: string;
  tokenId: string;
  token: string;
  scope: PortalTokenScope;
  resourceType: IPortalToken['resourceType'];
  resourceId?: string;
  organizationId: string;
  siteId?: string;
  startedAt: Date;
  lastActivityAt: Date;
  expiresAt: Date;
}

export interface IssuePortalTokenDTO {
  scope: PortalTokenScope;
  resourceType: IPortalToken['resourceType'];
  resourceId?: string;
  organizationId: string;
  siteId?: string;
  claimedBy?: string;
  /** TTL in minutes; defaults to 60 */
  ttlMinutes?: number;
}

export interface IPortalService {
  issueToken(dto: IssuePortalTokenDTO, issuedBy: string): Promise<IPortalToken>;
  validateToken(token: string): Promise<IPortalToken | null>;
  revokeToken(tokenId: string): Promise<void>;
  createSession(token: IPortalToken): Promise<IPortalSession>;
  getSession(sessionId: string): Promise<IPortalSession | null>;
  extendSession(sessionId: string, ttlMinutes?: number): Promise<IPortalSession | null>;
  listTokens(organizationId: string): Promise<IPortalToken[]>;
}
