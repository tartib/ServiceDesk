/**
 * Organization Context Management
 * 
 * Reads organizationId from the Zustand auth store (persisted).
 * Falls back to localStorage for backwards compatibility with raw fetch callers.
 */

import { useAuthStore } from '@/store/authStore';

/**
 * Get organization ID — prefers Zustand store, falls back to localStorage
 */
export function getOrganizationId(): string | null {
  // Try Zustand store first (works even outside React components)
  const storeOrgId = useAuthStore.getState().organizationId;
  if (storeOrgId) return storeOrgId;
  // Fallback to localStorage for legacy callers
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('organizationId');
}

/**
 * Set organization ID — updates both store and localStorage
 */
export function setOrganizationId(orgId: string): void {
  useAuthStore.getState().setOrganizationId(orgId);
}

/**
 * Clear organization ID
 */
export function clearOrganizationId(): void {
  useAuthStore.getState().setOrganizationId(null);
}

/**
 * Require organization ID - throws error if not set
 */
export function requireOrganizationId(): string {
  const orgId = getOrganizationId();
  if (!orgId) {
    throw new Error(
      'Organization context is required for this operation. Please select an organization first.'
    );
  }
  return orgId;
}

/**
 * Validate PM operation has organization context
 */
export function validatePMOperation(operationName: string): string {
  try {
    return requireOrganizationId();
  } catch (error) {
    console.error(`PM Operation "${operationName}" failed: Organization context missing`);
    throw error;
  }
}

/**
 * Check if organization context is available
 */
export function hasOrganizationContext(): boolean {
  return !!getOrganizationId();
}

/**
 * Get organization context or throw error
 */
export function getOrganizationContext(): {
  organizationId: string;
} {
  const organizationId = requireOrganizationId();
  return { organizationId };
}
