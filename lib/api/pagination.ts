/**
 * Shared shape for Django REST Framework's PageNumberPagination responses.
 * Every list endpoint on the backend returns this envelope; service methods
 * unwrap `.results` so existing call sites can keep working with plain arrays.
 */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/** Safely extracts an array from either a PaginatedResponse envelope or a bare array */
export function unwrapResults<T>(response: unknown): T[] {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (typeof response === 'object' && response !== null && 'results' in response && Array.isArray((response as any).results)) {
    return (response as any).results;
  }
  return [];
}

/** Common query params accepted by search-enabled list endpoints. */
export interface SearchParams {
  search?: string;
  page?: number;
  page_size?: number;
}

