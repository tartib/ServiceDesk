/**
 * Organization Context Management
 * Handles organization ID validation for PM operations
 */

/**
 * Get organization ID from localStorage
 */
export function getOrganizationId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('organizationId');
}

/**
 * Set organization ID in localStorage
 */
export function setOrganizationId(orgId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('organizationId', orgId);
}

/**
 * Clear organization ID from localStorage
 */
export function clearOrganizationId(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('organizationId');
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
    console.error(`❌ PM Operation "${operationName}" failed: Organization context missing`);
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
