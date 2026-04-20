/**
 * IncidentFormBinding — Links ITSM entity types to FormDefinitions (ADR 001 Phase 6)
 *
 * When an incident, change request, or service request is created, the ITSM module
 * uses this service to find the bound FormDefinition and pre-fill record data.
 *
 * Architecture:
 *   ITSM controllers → IncidentFormBinding → IFormDefinitionService
 */

import type { IFormDefinitionService, IFormDefinition } from '../../modules/forms/domain/platform-interfaces';
import type { IITSMFormBinding } from './types';

export class IncidentFormBinding {
  /** In-memory registry — replace with DB when persistence is required */
  private bindings: Map<string, IITSMFormBinding> = new Map();

  constructor(private readonly formDefinitionService: IFormDefinitionService) {}

  /**
   * Bind an ITSM entity type to a FormDefinition.
   * The definition must be published.
   */
  async bindEntityType(
    entityType: string,
    formDefinitionId: string,
    siteId?: string,
  ): Promise<IITSMFormBinding> {
    const definition = await this.formDefinitionService.getDefinition(formDefinitionId);
    if (!definition) {
      throw new Error(`FormDefinition not found: ${formDefinitionId}`);
    }
    if (!definition.is_published) {
      throw new Error(
        `FormDefinition "${formDefinitionId}" must be published before binding to ITSM entity type`,
      );
    }

    const key = this.bindingKey(entityType, siteId);
    const binding: IITSMFormBinding = {
      entityType,
      formDefinitionId,
      formDefinition: definition,
      isActive: true,
      siteId,
    };

    this.bindings.set(key, binding);
    return binding;
  }

  /**
   * Get the bound FormDefinition for an ITSM entity type.
   * Returns null if no binding exists.
   */
  async getDefinitionForEntityType(
    entityType: string,
    siteId?: string,
  ): Promise<IFormDefinition | null> {
    const key = this.bindingKey(entityType, siteId);
    const binding = this.bindings.get(key) ?? this.bindings.get(this.bindingKey(entityType));
    if (!binding || !binding.isActive) return null;

    return this.formDefinitionService.getDefinition(binding.formDefinitionId);
  }

  /** List all active bindings */
  listBindings(siteId?: string): IITSMFormBinding[] {
    return Array.from(this.bindings.values()).filter(
      (b) => b.isActive && (!siteId || !b.siteId || b.siteId === siteId),
    );
  }

  /** Deactivate a binding */
  deactivateBinding(entityType: string, siteId?: string): void {
    const key = this.bindingKey(entityType, siteId);
    const binding = this.bindings.get(key);
    if (binding) {
      binding.isActive = false;
    }
  }

  private bindingKey(entityType: string, siteId?: string): string {
    return siteId ? `${entityType}:${siteId}` : entityType;
  }
}
