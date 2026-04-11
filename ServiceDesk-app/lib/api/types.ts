/**
 * Standardized API Response Types
 *
 * All API calls should return one of these shapes.
 * The normalize.ts adapter handles unwrapping and _id → id mapping.
 */

/** Single entity response */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

/** List response with pagination */
export interface ApiListResponse<T> {
  success: boolean;
  data: T[];
  total?: number;
  page?: number;
  limit?: number;
}

/** Paginated response (alternative shape) */
export interface ApiPaginatedResponse<T> {
  success: boolean;
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Error response */
export interface ApiErrorResponse {
  success: false;
  error: string;
  message?: string;
  details?: Record<string, string[]>;
}

/** Mutation response (create/update/delete) */
export interface ApiMutationResponse<T = void> {
  success: boolean;
  data?: T;
  message?: string;
}
