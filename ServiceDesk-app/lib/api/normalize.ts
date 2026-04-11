/**
 * API Response Normalization Layer
 * Single source of truth for transforming API responses into domain models.
 * Replaces scattered _id || id mappings across hooks.
 */

/**
 * Normalize a single entity — maps _id to id if needed
 */
export function normalizeEntity<T>(raw: unknown): T {
  if (!raw || typeof raw !== 'object') {
    return raw as T;
  }

  const obj = raw as Record<string, unknown>;

  // Unwrap { data: T } or { success, data: T } envelopes
  if ('data' in obj && obj.data && typeof obj.data === 'object' && !Array.isArray(obj.data)) {
    return normalizeEntity<T>(obj.data);
  }

  // Map _id → id
  if ('_id' in obj && !('id' in obj)) {
    return { ...obj, id: obj._id } as unknown as T;
  }

  // Ensure id is present even when both exist
  if ('_id' in obj && 'id' in obj) {
    return { ...obj, id: obj._id || obj.id } as unknown as T;
  }

  return obj as T;
}

/**
 * Normalize a list of entities
 * Extracts array from common response shapes, then normalizes each item
 */
export function normalizeList<T>(raw: unknown): T[] {
  const arr = extractArray(raw);
  return arr.map((item) => normalizeEntity<T>(item));
}

/**
 * Normalize a paginated response
 */
export function normalizePaginated<T>(raw: unknown): {
  items: T[];
  total?: number;
  page?: number;
  limit?: number;
} {
  const items = normalizeList<T>(raw);

  if (!raw || typeof raw !== 'object') {
    return { items };
  }

  const obj = raw as Record<string, unknown>;

  return {
    items,
    total: typeof obj.total === 'number' ? obj.total : undefined,
    page: typeof obj.page === 'number' ? obj.page : undefined,
    limit: typeof obj.limit === 'number' ? obj.limit : undefined,
  };
}

/**
 * Extract an array from various API response shapes:
 * - T[] (direct array)
 * - { items: T[] }
 * - { data: T[] }
 * - { tasks: T[] }
 * - { results: T[] }
 * - { data: { items: T[] } }
 */
function extractArray(raw: unknown): unknown[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw !== 'object') return [];

  const obj = raw as Record<string, unknown>;

  if (Array.isArray(obj.items)) return obj.items;
  if (Array.isArray(obj.data)) return obj.data;
  if (Array.isArray(obj.tasks)) return obj.tasks;
  if (Array.isArray(obj.notifications)) return obj.notifications;
  if (Array.isArray(obj.results)) return obj.results;

  // Nested: { data: { items: T[] } }
  if (obj.data && typeof obj.data === 'object') {
    const dataObj = obj.data as Record<string, unknown>;
    if (Array.isArray(dataObj.items)) return dataObj.items;
    if (Array.isArray(dataObj.data)) return dataObj.data;
  }

  return [];
}

/**
 * Extract error message from response
 */
export function getErrorMessage(error: unknown): string {
  if (!error) return 'Unknown error occurred';
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;

  if (typeof error === 'object') {
    const obj = error as Record<string, unknown>;
    if (typeof obj.message === 'string') return obj.message;
    if (typeof obj.error === 'string') return obj.error;
    if (typeof obj.data === 'object') {
      const dataObj = obj.data as Record<string, unknown>;
      if (typeof dataObj.message === 'string') return dataObj.message;
    }
  }

  return 'Unknown error occurred';
}
