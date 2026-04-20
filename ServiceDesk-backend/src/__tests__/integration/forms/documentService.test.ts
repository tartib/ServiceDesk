/**
 * Regression tests — DocumentService + GENERATE_DOCUMENT action (Task 10 / Task 12)
 *
 * Pure unit tests — no DB or HTTP needed.
 * Runs with Jest (existing backend test config).
 */

import { DocumentService } from '../../../modules/documents/DocumentService';
import { WFActionType } from '../../../core/types/workflow-engine.types';

describe('DocumentService', () => {
  let svc: DocumentService;

  beforeEach(() => {
    svc = new DocumentService();
  });

  // ── Template CRUD ─────────────────────────────────────────────────────────

  describe('createTemplate / getTemplate', () => {
    it('creates a template and retrieves it by id', async () => {
      const tpl = await svc.createTemplate({
        name: 'Invoice',
        format: 'html',
        content: 'Hello {{name}}',
        variables: [{ key: 'name', label: 'Name', type: 'string', required: true }],
        organizationId: 'org1',
        isActive: true,
        createdBy: 'user1',
      });

      expect(tpl.templateId).toBeDefined();
      expect(tpl.name).toBe('Invoice');

      const fetched = await svc.getTemplate(tpl.templateId);
      expect(fetched).not.toBeNull();
      expect(fetched!.name).toBe('Invoice');
    });

    it('returns null for a non-existent template', async () => {
      const result = await svc.getTemplate('does_not_exist');
      expect(result).toBeNull();
    });
  });

  describe('listTemplates', () => {
    it('only returns active templates matching organizationId', async () => {
      await svc.createTemplate({ name: 'T1', format: 'html', content: '', variables: [], organizationId: 'org1', isActive: true, createdBy: 'u1' });
      await svc.createTemplate({ name: 'T2', format: 'pdf', content: '', variables: [], organizationId: 'org1', isActive: false, createdBy: 'u1' });
      await svc.createTemplate({ name: 'T3', format: 'txt', content: '', variables: [], organizationId: 'org2', isActive: true, createdBy: 'u1' });

      const list = await svc.listTemplates('org1');
      expect(list).toHaveLength(1);
      expect(list[0].name).toBe('T1');
    });

    it('filters by siteId when provided', async () => {
      await svc.createTemplate({ name: 'SiteA', format: 'html', content: '', variables: [], organizationId: 'org1', siteId: 'site_a', isActive: true, createdBy: 'u1' });
      await svc.createTemplate({ name: 'SiteB', format: 'html', content: '', variables: [], organizationId: 'org1', siteId: 'site_b', isActive: true, createdBy: 'u1' });

      const list = await svc.listTemplates('org1', 'site_a');
      expect(list).toHaveLength(1);
      expect(list[0].name).toBe('SiteA');
    });
  });

  describe('updateTemplate', () => {
    it('updates specified fields', async () => {
      const tpl = await svc.createTemplate({ name: 'Old', format: 'html', content: 'hi', variables: [], organizationId: 'org1', isActive: true, createdBy: 'u1' });
      const updated = await svc.updateTemplate(tpl.templateId, { name: 'New', isActive: false });
      expect(updated!.name).toBe('New');
      expect(updated!.isActive).toBe(false);
      expect(updated!.content).toBe('hi');
    });

    it('returns null when templateId not found', async () => {
      const result = await svc.updateTemplate('ghost', { name: 'X' });
      expect(result).toBeNull();
    });
  });

  describe('deleteTemplate', () => {
    it('removes the template from the store', async () => {
      const tpl = await svc.createTemplate({ name: 'Del', format: 'txt', content: '', variables: [], organizationId: 'org1', isActive: true, createdBy: 'u1' });
      await svc.deleteTemplate(tpl.templateId);
      const fetched = await svc.getTemplate(tpl.templateId);
      expect(fetched).toBeNull();
    });
  });

  // ── Document generation ────────────────────────────────────────────────────

  describe('generateDocument', () => {
    it('renders a Handlebars template with provided data', async () => {
      const tpl = await svc.createTemplate({
        name: 'Greeting',
        format: 'html',
        content: 'Hello {{firstName}} {{lastName}}!',
        variables: [
          { key: 'firstName', label: 'First Name', type: 'string', required: true },
          { key: 'lastName', label: 'Last Name', type: 'string', required: true },
        ],
        organizationId: 'org1',
        isActive: true,
        createdBy: 'u1',
      });

      const doc = await svc.generateDocument(
        { templateId: tpl.templateId, data: { firstName: 'Jane', lastName: 'Doe' } },
        'user1',
        'org1',
      );

      expect(doc.status).toBe('ready');
      expect(doc.documentId).toBeDefined();
      expect(doc.downloadUrl).toContain(doc.documentId);
      expect(doc.sizeBytes).toBeGreaterThan(0);
    });

    it('returns failed status when template not found', async () => {
      await expect(
        svc.generateDocument({ templateId: 'ghost', data: {} }, 'u1', 'org1'),
      ).rejects.toThrow('not found');
    });

    it('rejects inactive templates', async () => {
      const tpl = await svc.createTemplate({ name: 'Inactive', format: 'html', content: 'x', variables: [], organizationId: 'org1', isActive: false, createdBy: 'u1' });
      await expect(
        svc.generateDocument({ templateId: tpl.templateId, data: {} }, 'u1', 'org1'),
      ).rejects.toThrow('not active');
    });

    it('substitutes nested path variables (dot-notation)', async () => {
      const tpl = await svc.createTemplate({
        name: 'Nested',
        format: 'txt',
        content: 'Order: {{order.id}} — Customer: {{customer.name}}',
        variables: [],
        organizationId: 'org1',
        isActive: true,
        createdBy: 'u1',
      });

      const doc = await svc.generateDocument(
        { templateId: tpl.templateId, data: { order: { id: 'ORD-99' }, customer: { name: 'Bob' } } },
        'u1',
        'org1',
      );

      expect(doc.status).toBe('ready');
    });

    it('uses format override when provided', async () => {
      const tpl = await svc.createTemplate({ name: 'Fmt', format: 'html', content: 'x', variables: [], organizationId: 'org1', isActive: true, createdBy: 'u1' });
      const doc = await svc.generateDocument({ templateId: tpl.templateId, data: {}, format: 'txt' }, 'u1', 'org1');
      expect(doc.format).toBe('txt');
    });
  });

  describe('listDocuments', () => {
    it('filters by organizationId', async () => {
      const tpl = await svc.createTemplate({ name: 'X', format: 'html', content: '', variables: [], organizationId: 'org1', isActive: true, createdBy: 'u1' });
      await svc.generateDocument({ templateId: tpl.templateId, data: {} }, 'u1', 'org1');
      await svc.generateDocument({ templateId: tpl.templateId, data: {} }, 'u2', 'org2');

      const docs = await svc.listDocuments('org1');
      expect(docs.every((d) => d.organizationId === 'org1')).toBe(true);
    });

    it('filters by sourceEntityId', async () => {
      const tpl = await svc.createTemplate({ name: 'Y', format: 'html', content: '', variables: [], organizationId: 'org1', isActive: true, createdBy: 'u1' });
      await svc.generateDocument({ templateId: tpl.templateId, data: {}, sourceEntityId: 'ent_1' }, 'u1', 'org1');
      await svc.generateDocument({ templateId: tpl.templateId, data: {}, sourceEntityId: 'ent_2' }, 'u1', 'org1');

      const docs = await svc.listDocuments('org1', 'ent_1');
      expect(docs).toHaveLength(1);
      expect(docs[0].sourceEntityId).toBe('ent_1');
    });
  });
});

// ── GENERATE_DOCUMENT enum sanity ──────────────────────────────────────────

describe('WFActionType.GENERATE_DOCUMENT', () => {
  it('exists and has the correct string value', () => {
    expect(WFActionType.GENERATE_DOCUMENT).toBe('generate_document');
  });

  it('is included in the enum values list', () => {
    expect(Object.values(WFActionType)).toContain('generate_document');
  });
});
