/**
 * ServiceCatalogService — Service Catalog Solution Facade (ADR 001 Phase 6)
 *
 * Manages the catalog: which published FormDefinitions are visible
 * as self-service items. Consumes IFormDefinitionService — never
 * imports formTemplateService internals directly.
 *
 * Architecture:
 *   self-service UI → ServiceCatalogService → IFormDefinitionService
 *                                           → IRecordService (via requestService)
 */

import type { IFormDefinitionService } from '../../modules/forms/domain/platform-interfaces';
import type { IRecordService } from '../../modules/forms/domain/record-interfaces';
import type { IServiceCatalogItem, CreateCatalogItemDTO } from './types';

export class ServiceCatalogService {
  /** In-memory store for catalog items (replace with DB layer when persistence is required) */
  private items: Map<string, IServiceCatalogItem> = new Map();
  private nextOrder = 1;

  constructor(
    private readonly formDefinitionService: IFormDefinitionService,
    private readonly recordService: IRecordService,
  ) {}

  // ── Catalog management ─────────────────────────────────────────────────────

  /**
   * Publish a FormDefinition into the service catalog.
   * The form must already be published via formDefinitionService.
   */
  async addCatalogItem(dto: CreateCatalogItemDTO): Promise<IServiceCatalogItem> {
    const definition = await this.formDefinitionService.getDefinition(dto.formDefinitionId);
    if (!definition) {
      throw new Error(`FormDefinition not found: ${dto.formDefinitionId}`);
    }
    if (!definition.is_published) {
      throw new Error(
        `FormDefinition "${dto.formDefinitionId}" must be published before adding to catalog`,
      );
    }

    const item: IServiceCatalogItem = {
      catalogItemId: `ci_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      formDefinitionId: dto.formDefinitionId,
      formDefinition: definition,
      displayOrder: dto.displayOrder ?? this.nextOrder++,
      isVisible: dto.isVisible ?? true,
      tags: dto.tags ?? [],
      siteId: dto.siteId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.items.set(item.catalogItemId, item);
    return item;
  }

  /** List all visible catalog items, optionally filtered by siteId */
  async listCatalogItems(siteId?: string): Promise<IServiceCatalogItem[]> {
    const all = Array.from(this.items.values()).filter((i) => i.isVisible);
    const filtered = siteId ? all.filter((i) => !i.siteId || i.siteId === siteId) : all;
    return filtered.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  /** Get a single catalog item by ID */
  async getCatalogItem(catalogItemId: string): Promise<IServiceCatalogItem | null> {
    return this.items.get(catalogItemId) ?? null;
  }

  /** Toggle visibility of a catalog item */
  async setVisibility(catalogItemId: string, isVisible: boolean): Promise<IServiceCatalogItem> {
    const item = this.items.get(catalogItemId);
    if (!item) throw new Error(`Catalog item not found: ${catalogItemId}`);
    item.isVisible = isVisible;
    item.updatedAt = new Date();
    return item;
  }

  /** Remove an item from the catalog */
  async removeCatalogItem(catalogItemId: string): Promise<void> {
    this.items.delete(catalogItemId);
  }

  // ── Self-service request flow ──────────────────────────────────────────────

  /**
   * Request a service — validates catalog item visibility then creates a record.
   * This is the single entry-point for all self-service submissions.
   */
  async requestService(
    catalogItemId: string,
    userId: string,
    data: Record<string, unknown>,
    siteId?: string,
  ): Promise<ReturnType<IRecordService['createRecord']>> {
    const item = await this.getCatalogItem(catalogItemId);
    if (!item) throw new Error(`Catalog item not found: ${catalogItemId}`);
    if (!item.isVisible) throw new Error(`Catalog item "${catalogItemId}" is not available`);
    if (siteId && item.siteId && item.siteId !== siteId) {
      throw new Error(`Catalog item "${catalogItemId}" is not available for site "${siteId}"`);
    }

    return this.recordService.createRecord({
      form_template_id: item.formDefinitionId,
      submitted_by: { user_id: userId, name: userId, email: '' },
      data,
      site_id: siteId,
      is_draft: false,
    });
  }
}
