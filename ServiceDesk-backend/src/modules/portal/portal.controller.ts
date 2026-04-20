/**
 * Portal Controller — REST handlers for the Portal module
 */

import { Request, Response } from 'express';
import { portalService } from './PortalService';

export const portalController = {
  /** POST /api/v2/portal/tokens — issue a portal access token */
  async issueToken(req: Request, res: Response) {
    try {
      const issuedBy: string = (req as any).userId ?? req.body.issuedBy ?? 'system';
      const token = await portalService.issueToken(req.body, issuedBy);
      res.status(201).json({ token });
    } catch (err: unknown) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to issue token' });
    }
  },

  /** POST /api/v2/portal/tokens/validate — validate a portal token and create a session */
  async validateToken(req: Request, res: Response) {
    try {
      const { token } = req.body as { token: string };
      if (!token) return res.status(400).json({ error: 'token is required' });

      const record = await portalService.validateToken(token);
      if (!record) return res.status(401).json({ error: 'Invalid or expired token' });

      const session = await portalService.createSession(record);
      res.json({ session, scope: record.scope, resourceType: record.resourceType, resourceId: record.resourceId });
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to validate token' });
    }
  },

  /** DELETE /api/v2/portal/tokens/:tokenId — revoke a portal token */
  async revokeToken(req: Request, res: Response) {
    try {
      await portalService.revokeToken(req.params.tokenId);
      res.status(204).send();
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to revoke token' });
    }
  },

  /** GET /api/v2/portal/tokens — list issued tokens for org */
  async listTokens(req: Request, res: Response) {
    try {
      const orgId: string = (req as any).organizationId ?? (req.query.organizationId as string);
      const tokens = await portalService.listTokens(orgId);
      res.json({ tokens });
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to list tokens' });
    }
  },

  /** GET /api/v2/portal/sessions/:sessionId — get an active session */
  async getSession(req: Request, res: Response) {
    try {
      const session = await portalService.getSession(req.params.sessionId);
      if (!session) return res.status(404).json({ error: 'Session not found or expired' });
      res.json({ session });
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to get session' });
    }
  },

  /** POST /api/v2/portal/sessions/:sessionId/extend — extend session TTL */
  async extendSession(req: Request, res: Response) {
    try {
      const ttlMinutes = req.body.ttlMinutes as number | undefined;
      const session = await portalService.extendSession(req.params.sessionId, ttlMinutes);
      if (!session) return res.status(404).json({ error: 'Session not found' });
      res.json({ session });
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to extend session' });
    }
  },
};
