/**
 * Service Catalog Solution — Domain Types (Phase 6 stub)
 *
 * All types reference platform interfaces, not module internals.
 */

import type { IFormDefinition } from '../../modules/forms/domain/platform-interfaces';

/** A catalog item — a published form made available for self-service */
export interface IServiceCatalogItem {
  catalogItemId: string;
  formDefinitionId: string;
  /** Resolved at query time via IFormDefinitionService */
  formDefinition?: IFormDefinition;
  displayOrder: number;
  isVisible: boolean;
  tags: string[];
  siteId?: string;
  createdAt: Date;
  updatedAt: Date;
}

/** DTO for creating a catalog item */
export interface CreateCatalogItemDTO {
  formDefinitionId: string;
  displayOrder?: number;
  isVisible?: boolean;
  tags?: string[];
  siteId?: string;
}
