/**
 * Document Controller — REST handlers for the Documents module
 */

import { Request, Response } from 'express';
import { documentService } from './DocumentService';

export const documentController = {
  /** POST /api/v2/documents/templates */
  async createTemplate(req: Request, res: Response) {
    try {
      const orgId: string = (req as any).organizationId ?? req.body.organizationId;
      const userId: string = (req as any).userId ?? req.body.createdBy;
      const template = await documentService.createTemplate({
        ...req.body,
        organizationId: orgId,
        createdBy: userId,
        isActive: req.body.isActive ?? true,
      });
      res.status(201).json({ template });
    } catch (err: unknown) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to create template' });
    }
  },

  /** GET /api/v2/documents/templates */
  async listTemplates(req: Request, res: Response) {
    try {
      const orgId: string = (req as any).organizationId ?? (req.query.organizationId as string);
      const siteId = req.query.siteId as string | undefined;
      const templates = await documentService.listTemplates(orgId, siteId);
      res.json({ templates });
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to list templates' });
    }
  },

  /** GET /api/v2/documents/templates/:templateId */
  async getTemplate(req: Request, res: Response) {
    try {
      const template = await documentService.getTemplate(req.params.templateId);
      if (!template) return res.status(404).json({ error: 'Template not found' });
      res.json({ template });
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to get template' });
    }
  },

  /** PATCH /api/v2/documents/templates/:templateId */
  async updateTemplate(req: Request, res: Response) {
    try {
      const template = await documentService.updateTemplate(req.params.templateId, req.body);
      if (!template) return res.status(404).json({ error: 'Template not found' });
      res.json({ template });
    } catch (err: unknown) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to update template' });
    }
  },

  /** DELETE /api/v2/documents/templates/:templateId */
  async deleteTemplate(req: Request, res: Response) {
    try {
      await documentService.deleteTemplate(req.params.templateId);
      res.status(204).send();
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to delete template' });
    }
  },

  /** POST /api/v2/documents/generate */
  async generateDocument(req: Request, res: Response) {
    try {
      const orgId: string = (req as any).organizationId ?? req.body.organizationId;
      const userId: string = (req as any).userId ?? req.body.renderedBy;
      const doc = await documentService.generateDocument(req.body, userId, orgId);
      res.status(doc.status === 'ready' ? 201 : 422).json({ document: doc });
    } catch (err: unknown) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to generate document' });
    }
  },

  /** GET /api/v2/documents/:documentId */
  async getDocument(req: Request, res: Response) {
    try {
      const doc = await documentService.getDocument(req.params.documentId);
      if (!doc) return res.status(404).json({ error: 'Document not found' });
      res.json({ document: doc });
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to get document' });
    }
  },

  /** GET /api/v2/documents */
  async listDocuments(req: Request, res: Response) {
    try {
      const orgId: string = (req as any).organizationId ?? (req.query.organizationId as string);
      const sourceEntityId = req.query.sourceEntityId as string | undefined;
      const documents = await documentService.listDocuments(orgId, sourceEntityId);
      res.json({ documents });
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to list documents' });
    }
  },
};
