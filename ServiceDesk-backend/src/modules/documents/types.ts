/**
 * Documents Module — Domain Types (ADR 001 Platform Pillar)
 *
 * Defines the document generation platform interfaces.
 * Templates are stored server-side; rendered documents are produced on demand.
 */

export type DocumentFormat = 'pdf' | 'html' | 'docx' | 'txt';
export type DocumentStatus = 'pending' | 'rendering' | 'ready' | 'failed';

export interface IDocumentTemplate {
  templateId: string;
  name: string;
  name_ar?: string;
  description?: string;
  format: DocumentFormat;
  /** Handlebars/Mustache template string */
  content: string;
  /** Variable definitions used in the template */
  variables: ITemplateVariable[];
  organizationId: string;
  siteId?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITemplateVariable {
  key: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'array';
  required: boolean;
  defaultValue?: unknown;
}

export interface IRenderedDocument {
  documentId: string;
  templateId: string;
  /** Source record/entity that triggered generation */
  sourceEntityType?: string;
  sourceEntityId?: string;
  format: DocumentFormat;
  status: DocumentStatus;
  /** URL to the rendered document (signed URL or internal path) */
  downloadUrl?: string;
  /** Size in bytes */
  sizeBytes?: number;
  renderedBy: string;
  renderedAt?: Date;
  expiresAt?: Date;
  error?: string;
  organizationId: string;
  createdAt: Date;
}

export interface GenerateDocumentDTO {
  templateId: string;
  data: Record<string, unknown>;
  sourceEntityType?: string;
  sourceEntityId?: string;
  /** Requested format — falls back to template's default format */
  format?: DocumentFormat;
}

export interface IDocumentService {
  createTemplate(dto: Omit<IDocumentTemplate, 'templateId' | 'createdAt' | 'updatedAt'>): Promise<IDocumentTemplate>;
  getTemplate(templateId: string): Promise<IDocumentTemplate | null>;
  listTemplates(organizationId: string, siteId?: string): Promise<IDocumentTemplate[]>;
  updateTemplate(templateId: string, dto: Partial<IDocumentTemplate>): Promise<IDocumentTemplate | null>;
  deleteTemplate(templateId: string): Promise<void>;
  generateDocument(dto: GenerateDocumentDTO, renderedBy: string, organizationId: string): Promise<IRenderedDocument>;
  getDocument(documentId: string): Promise<IRenderedDocument | null>;
  listDocuments(organizationId: string, sourceEntityId?: string): Promise<IRenderedDocument[]>;
}
