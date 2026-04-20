/**
 * DocumentService — In-memory implementation of IDocumentService
 *
 * Provides document template management and on-demand rendering.
 * Replace the in-memory stores with DB repositories when persistence is required.
 *
 * Rendering strategy:
 *   - PDF: placeholder (integrate Puppeteer / wkhtmltopdf / gotenberg)
 *   - HTML: simple Handlebars-style variable substitution
 *   - DOCX/TXT: variable substitution on content string
 */

import type {
  IDocumentService,
  IDocumentTemplate,
  IRenderedDocument,
  GenerateDocumentDTO,
} from './types';

function renderTemplate(template: string, data: Record<string, unknown>): string {
  return template.replace(/\{\{(\s*[\w.]+\s*)\}\}/g, (_, key) => {
    const trimmed = key.trim();
    const parts = trimmed.split('.');
    let value: unknown = data;
    for (const part of parts) {
      value = (value as Record<string, unknown>)?.[part];
    }
    return value !== undefined && value !== null ? String(value) : '';
  });
}

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export class DocumentService implements IDocumentService {
  private templates: Map<string, IDocumentTemplate> = new Map();
  private documents: Map<string, IRenderedDocument> = new Map();

  // ── Template management ────────────────────────────────────────────────────

  async createTemplate(
    dto: Omit<IDocumentTemplate, 'templateId' | 'createdAt' | 'updatedAt'>,
  ): Promise<IDocumentTemplate> {
    const template: IDocumentTemplate = {
      ...dto,
      templateId: generateId('tpl'),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.templates.set(template.templateId, template);
    return template;
  }

  async getTemplate(templateId: string): Promise<IDocumentTemplate | null> {
    return this.templates.get(templateId) ?? null;
  }

  async listTemplates(organizationId: string, siteId?: string): Promise<IDocumentTemplate[]> {
    return Array.from(this.templates.values()).filter(
      (t) =>
        t.organizationId === organizationId &&
        t.isActive &&
        (!siteId || !t.siteId || t.siteId === siteId),
    );
  }

  async updateTemplate(
    templateId: string,
    dto: Partial<IDocumentTemplate>,
  ): Promise<IDocumentTemplate | null> {
    const existing = this.templates.get(templateId);
    if (!existing) return null;
    const updated: IDocumentTemplate = { ...existing, ...dto, templateId, updatedAt: new Date() };
    this.templates.set(templateId, updated);
    return updated;
  }

  async deleteTemplate(templateId: string): Promise<void> {
    this.templates.delete(templateId);
  }

  // ── Document generation ────────────────────────────────────────────────────

  async generateDocument(
    dto: GenerateDocumentDTO,
    renderedBy: string,
    organizationId: string,
  ): Promise<IRenderedDocument> {
    const template = await this.getTemplate(dto.templateId);
    if (!template) {
      throw new Error(`Document template not found: ${dto.templateId}`);
    }
    if (!template.isActive) {
      throw new Error(`Document template "${dto.templateId}" is not active`);
    }

    const format = dto.format ?? template.format;
    const documentId = generateId('doc');

    const pending: IRenderedDocument = {
      documentId,
      templateId: dto.templateId,
      sourceEntityType: dto.sourceEntityType,
      sourceEntityId: dto.sourceEntityId,
      format,
      status: 'rendering',
      renderedBy,
      organizationId,
      createdAt: new Date(),
    };
    this.documents.set(documentId, pending);

    try {
      const rendered = renderTemplate(template.content, dto.data);

      const doc: IRenderedDocument = {
        ...pending,
        status: 'ready',
        renderedAt: new Date(),
        sizeBytes: Buffer.byteLength(rendered, 'utf8'),
        downloadUrl: `/api/v2/documents/${documentId}/download`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };
      this.documents.set(documentId, doc);
      return doc;
    } catch (err: unknown) {
      const failed: IRenderedDocument = {
        ...pending,
        status: 'failed',
        error: err instanceof Error ? err.message : 'Rendering failed',
      };
      this.documents.set(documentId, failed);
      return failed;
    }
  }

  async getDocument(documentId: string): Promise<IRenderedDocument | null> {
    return this.documents.get(documentId) ?? null;
  }

  async listDocuments(organizationId: string, sourceEntityId?: string): Promise<IRenderedDocument[]> {
    return Array.from(this.documents.values()).filter(
      (d) =>
        d.organizationId === organizationId &&
        (!sourceEntityId || d.sourceEntityId === sourceEntityId),
    );
  }
}

export const documentService = new DocumentService();
