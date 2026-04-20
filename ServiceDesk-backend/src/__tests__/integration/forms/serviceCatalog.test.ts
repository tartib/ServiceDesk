/**
 * Regression tests — ServiceCatalogService + SelfServiceFacade (Task 9 / Task 12)
 *
 * Uses Jest mocking to isolate the facades from platform service dependencies.
 */

import type { IFormDefinitionService } from '../../../modules/forms/domain/platform-interfaces';
import type { IRecordService } from '../../../modules/forms/domain/record-interfaces';
import { ServiceCatalogService } from '../../../solutions/service-catalog/ServiceCatalogService';
import { SelfServiceFacade } from '../../../solutions/service-catalog/SelfServiceFacade';

// ── Helper builders ────────────────────────────────────────────────────────

function makeFormDef(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    _id: 'def_1',
    name: 'IT Request',
    name_ar: '',
    description: 'Test form',
    category: 'it_service',
    organizationId: 'org_1',
    siteId: 'site_1',
    is_active: true,
    is_published: true,
    version: 1,
    fields: [],
    workflow_mode: 'simple' as const,
    created_by: 'user_1',
    updated_by: 'user_1',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeSubmissionDoc(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    _id: 'sub_1',
    form_template_id: 'def_1',
    submitted_by: { user_id: 'u1', name: 'Alice', email: 'alice@test.com' },
    data: { item: 'Laptop' },
    workflow_state: { status: 'submitted' },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ── Mocks ─────────────────────────────────────────────────────────────────

const mockFormService: jest.Mocked<IFormDefinitionService> = {
  createDefinition: jest.fn(),
  getDefinition: jest.fn(),
  listDefinitions: jest.fn(),
  updateDefinition: jest.fn(),
  deleteDefinition: jest.fn(),
  publishDefinition: jest.fn(),
  unpublishDefinition: jest.fn(),
  validateDefinition: jest.fn(),
  getPublishedDefinitions: jest.fn(),
  getCategories: jest.fn(),
};

const mockRecordService: jest.Mocked<IRecordService> = {
  createRecord: jest.fn(),
  getRecord: jest.fn(),
  listRecords: jest.fn(),
  updateRecordData: jest.fn(),
  updateRecordStatus: jest.fn(),
  approveRecord: jest.fn(),
  rejectRecord: jest.fn(),
  deleteRecord: jest.fn(),
  toRecordDetail: jest.fn(),
};

// ── ServiceCatalogService ─────────────────────────────────────────────────

describe('ServiceCatalogService', () => {
  let catalogService: ServiceCatalogService;

  beforeEach(() => {
    jest.clearAllMocks();
    catalogService = new ServiceCatalogService(mockFormService, mockRecordService);
  });

  describe('addCatalogItem / getCatalogItem', () => {
    it('adds a published form def and retrieves it as a catalog item', async () => {
      mockFormService.getDefinition.mockResolvedValue(makeFormDef() as any);

      const item = await catalogService.addCatalogItem({
        formDefinitionId: 'def_1',
        isVisible: true,
        tags: ['hardware'],
      });

      expect(item.catalogItemId).toBeDefined();
      expect(item.formDefinitionId).toBe('def_1');
      expect(item.isVisible).toBe(true);
      expect(item.tags).toContain('hardware');

      const fetched = await catalogService.getCatalogItem(item.catalogItemId);
      expect(fetched).not.toBeNull();
      expect(fetched!.catalogItemId).toBe(item.catalogItemId);
    });

    it('throws when form definition does not exist', async () => {
      mockFormService.getDefinition.mockResolvedValue(null);
      await expect(
        catalogService.addCatalogItem({ formDefinitionId: 'ghost' }),
      ).rejects.toThrow('not found');
    });

    it('throws when form definition is not published', async () => {
      mockFormService.getDefinition.mockResolvedValue(makeFormDef({ is_published: false }) as any);
      await expect(
        catalogService.addCatalogItem({ formDefinitionId: 'def_1' }),
      ).rejects.toThrow('published');
    });
  });

  describe('listCatalogItems', () => {
    it('returns only visible items', async () => {
      mockFormService.getDefinition.mockResolvedValue(makeFormDef() as any);

      const visible = await catalogService.addCatalogItem({ formDefinitionId: 'def_1', isVisible: true });
      const hidden = await catalogService.addCatalogItem({ formDefinitionId: 'def_1', isVisible: false });

      const list = await catalogService.listCatalogItems();
      expect(list.some((i) => i.catalogItemId === visible.catalogItemId)).toBe(true);
      expect(list.some((i) => i.catalogItemId === hidden.catalogItemId)).toBe(false);
    });

    it('filters by siteId when provided', async () => {
      mockFormService.getDefinition.mockResolvedValue(makeFormDef({ siteId: 'site_a' }) as any);
      const siteA = await catalogService.addCatalogItem({ formDefinitionId: 'def_1', siteId: 'site_a', isVisible: true });

      mockFormService.getDefinition.mockResolvedValue(makeFormDef({ siteId: 'site_b' }) as any);
      await catalogService.addCatalogItem({ formDefinitionId: 'def_1', siteId: 'site_b', isVisible: true });

      const list = await catalogService.listCatalogItems('site_a');
      expect(list.some((i) => i.catalogItemId === siteA.catalogItemId)).toBe(true);
    });
  });

  describe('requestService', () => {
    it('calls createRecord via IRecordService', async () => {
      mockFormService.getDefinition.mockResolvedValue(makeFormDef() as any);
      mockRecordService.createRecord.mockResolvedValue(makeSubmissionDoc() as any);

      const item = await catalogService.addCatalogItem({ formDefinitionId: 'def_1', isVisible: true });
      await catalogService.requestService(item.catalogItemId, 'u1', { item: 'Laptop' });

      expect(mockRecordService.createRecord).toHaveBeenCalledTimes(1);
      expect(mockRecordService.createRecord).toHaveBeenCalledWith(
        expect.objectContaining({ form_template_id: 'def_1' }),
      );
    });

    it('throws when catalog item is not visible', async () => {
      mockFormService.getDefinition.mockResolvedValue(makeFormDef() as any);
      const item = await catalogService.addCatalogItem({ formDefinitionId: 'def_1', isVisible: false });

      await expect(
        catalogService.requestService(item.catalogItemId, 'u1', {}),
      ).rejects.toThrow('not available');
    });

    it('throws when catalog item does not exist', async () => {
      await expect(
        catalogService.requestService('ghost_item', 'u1', {}),
      ).rejects.toThrow('not found');
    });
  });

  describe('setVisibility / removeCatalogItem', () => {
    it('toggles visibility', async () => {
      mockFormService.getDefinition.mockResolvedValue(makeFormDef() as any);
      const item = await catalogService.addCatalogItem({ formDefinitionId: 'def_1', isVisible: true });

      const updated = await catalogService.setVisibility(item.catalogItemId, false);
      expect(updated.isVisible).toBe(false);
    });

    it('removes item from the store', async () => {
      mockFormService.getDefinition.mockResolvedValue(makeFormDef() as any);
      const item = await catalogService.addCatalogItem({ formDefinitionId: 'def_1', isVisible: true });

      await catalogService.removeCatalogItem(item.catalogItemId);
      const fetched = await catalogService.getCatalogItem(item.catalogItemId);
      expect(fetched).toBeNull();
    });
  });
});

// ── SelfServiceFacade ─────────────────────────────────────────────────────

describe('SelfServiceFacade', () => {
  let facade: SelfServiceFacade;

  beforeEach(() => {
    jest.clearAllMocks();
    facade = new SelfServiceFacade(mockRecordService);
  });

  describe('listUserRecords', () => {
    it('returns records filtered by userId and customer-visible statuses', async () => {
      mockRecordService.listRecords.mockResolvedValue({
        submissions: [
          makeSubmissionDoc({ workflow_state: { status: 'submitted' } }),
          makeSubmissionDoc({ workflow_state: { status: 'draft' } }),
        ] as any,
        total: 2,
        page: 1,
        limit: 20,
        total_pages: 1,
      });

      const result = await facade.listUserRecords('u1');
      expect(result.submissions).toHaveLength(1);
      expect(mockRecordService.listRecords).toHaveBeenCalledWith(
        expect.objectContaining({ submitted_by: 'u1' }),
      );
    });

    it('returns all records when bypassPolicy is true', async () => {
      mockRecordService.listRecords.mockResolvedValue({
        submissions: [
          makeSubmissionDoc({ workflow_state: { status: 'submitted' } }),
          makeSubmissionDoc({ workflow_state: { status: 'draft' } }),
        ] as any,
        total: 2,
        page: 1,
        limit: 20,
        total_pages: 1,
      });

      const result = await facade.listUserRecords('u1', {}, true);
      expect(result.submissions).toHaveLength(2);
    });
  });

  describe('getUserRecord', () => {
    it('returns the record when it belongs to the user', async () => {
      const doc = makeSubmissionDoc() as any;
      mockRecordService.getRecord.mockResolvedValue(doc);
      mockRecordService.toRecordDetail.mockReturnValue({ id: 'sub_1' } as any);

      const rec = await facade.getUserRecord('sub_1', 'u1');
      expect(rec).not.toBeNull();
    });

    it('returns null when the record belongs to a different user', async () => {
      const doc = makeSubmissionDoc({ submitted_by: { user_id: 'other', name: 'Bob', email: '' } }) as any;
      mockRecordService.getRecord.mockResolvedValue(doc);

      const rec = await facade.getUserRecord('sub_1', 'u1');
      expect(rec).toBeNull();
    });

    it('returns null when record does not exist', async () => {
      mockRecordService.getRecord.mockResolvedValue(null);
      const rec = await facade.getUserRecord('ghost', 'u1');
      expect(rec).toBeNull();
    });

    it('bypasses ownership check when bypassPolicy is true', async () => {
      const doc = makeSubmissionDoc({ submitted_by: { user_id: 'other', name: 'Bob', email: '' } }) as any;
      mockRecordService.getRecord.mockResolvedValue(doc);
      mockRecordService.toRecordDetail.mockReturnValue({ id: 'sub_1' } as any);

      const rec = await facade.getUserRecord('sub_1', 'u1', true);
      expect(rec).not.toBeNull();
    });
  });
});
