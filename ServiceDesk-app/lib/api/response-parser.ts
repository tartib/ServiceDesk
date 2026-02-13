/**
 * API Response Parser Utility
 * Standardizes response format handling across all hooks
 * Handles multiple response formats from axios interceptor
 */

/**
 * Parse a single API response
 * Handles multiple response formats:
 * - { data: T }
 * - { success: boolean; data: T }
 * - T (direct value)
 * - { items: T[] } or { data: T[] }
 */
export function parseApiResponse<T>(response: unknown): T {
  if (!response) {
    return undefined as T;
  }

  // If it's already the correct type, return as is
  if (typeof response !== 'object') {
    return response as T;
  }

  const obj = response as Record<string, unknown>;

  // Handle { data: T } format
  if ('data' in obj && obj.data !== undefined) {
    return obj.data as T;
  }

  // Handle array responses
  if (Array.isArray(response)) {
    return response as T;
  }

  // Return as is if no data property
  return response as T;
}

/**
 * Parse a list API response
 * Extracts array from various response formats
 */
export function parseListResponse<T>(response: unknown): T[] {
  if (!response) {
    return [];
  }

  // If it's already an array, return it
  if (Array.isArray(response)) {
    return response as T[];
  }

  if (typeof response !== 'object') {
    return [];
  }

  const obj = response as Record<string, unknown>;

  // Try to find array in common properties
  if (Array.isArray(obj.items)) {
    return obj.items as T[];
  }

  if (Array.isArray(obj.data)) {
    return obj.data as T[];
  }

  if (Array.isArray(obj.tasks)) {
    return obj.tasks as T[];
  }

  if (Array.isArray(obj.results)) {
    return obj.results as T[];
  }

  // If data is an object with items/data, try that
  if (obj.data && typeof obj.data === 'object') {
    const dataObj = obj.data as Record<string, unknown>;
    if (Array.isArray(dataObj.items)) {
      return dataObj.items as T[];
    }
    if (Array.isArray(dataObj.data)) {
      return dataObj.data as T[];
    }
  }

  return [];
}

/**
 * Parse paginated response
 * Extracts data and pagination info
 */
export function parsePaginatedResponse<T>(response: unknown): {
  items: T[];
  total?: number;
  page?: number;
  limit?: number;
} {
  const items = parseListResponse<T>(response);

  if (!response || typeof response !== 'object') {
    return { items };
  }

  const obj = response as Record<string, unknown>;

  return {
    items,
    total: typeof obj.total === 'number' ? obj.total : undefined,
    page: typeof obj.page === 'number' ? obj.page : undefined,
    limit: typeof obj.limit === 'number' ? obj.limit : undefined,
  };
}

/**
 * Extract error message from response
 */
export function getErrorMessage(error: unknown): string {
  if (!error) {
    return 'Unknown error occurred';
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'object') {
    const obj = error as Record<string, unknown>;

    if (typeof obj.message === 'string') {
      return obj.message;
    }

    if (typeof obj.error === 'string') {
      return obj.error;
    }

    if (typeof obj.data === 'object') {
      const dataObj = obj.data as Record<string, unknown>;
      if (typeof dataObj.message === 'string') {
        return dataObj.message;
      }
    }
  }

  return 'Unknown error occurred';
}
