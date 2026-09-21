/**
 * Reusable Error Normalization Mechanism
 *
 * Normalizes Django REST Framework errors into a consistent, user-friendly format:
 * - Field-level validation errors: { field: ["error message"] }
 * - Non-field errors: { non_field_errors: ["error message"] }
 * - Detail errors: { detail: "message" }
 * - Message errors: { message: "message" }
 * - Plain string errors: "error message"
 * - Network failures, timeouts, and HTTP status codes
 */

export interface NormalizedError {
  message: string;
  fieldErrors: Record<string, string[]>;
  status?: number;
  raw?: unknown;
}

export class ApiError extends Error {
  public status?: number;
  public fieldErrors: Record<string, string[]>;
  public raw?: unknown;

  constructor(normalized: NormalizedError) {
    super(normalized.message);
    this.name = 'ApiError';
    this.status = normalized.status;
    this.fieldErrors = normalized.fieldErrors;
    this.raw = normalized.raw;
  }
}

/**
 * Normalizes any error response or exception into a user-friendly NormalizedError
 */
export function normalizeApiError(error: unknown, fallbackStatus?: number): NormalizedError {
  const fieldErrors: Record<string, string[]> = {};
  let message = 'An unexpected error occurred. Please try again.';
  let status = fallbackStatus;

  if (!error) {
    return { message, fieldErrors, status };
  }

  // If already an ApiError instance
  if (error instanceof ApiError) {
    return {
      message: error.message,
      fieldErrors: error.fieldErrors,
      status: error.status,
      raw: error.raw,
    };
  }

  // If it's a standard JS Error
  if (error instanceof Error) {
    message = error.message;
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      message = 'The request timed out. Please check your connection.';
      status = 408;
    } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      message = 'Network error. Please ensure the backend server is reachable.';
      status = 0;
    }
  }

  // If error is a plain string
  if (typeof error === 'string') {
    return {
      message: error.trim(),
      fieldErrors,
      status,
      raw: error,
    };
  }

  // If error is an object (e.g. parsed JSON response from DRF)
  if (typeof error === 'object' && error !== null) {
    const errObj = error as Record<string, any>;

    if (errObj.status && typeof errObj.status === 'number') {
      status = errObj.status;
    }

    // 1. DRF { "detail": "..." }
    if (typeof errObj.detail === 'string') {
      message = errObj.detail;
    } else if (Array.isArray(errObj.detail) && errObj.detail.length > 0) {
      message = String(errObj.detail[0]);
    }

    // 2. { "message": "..." }
    if (typeof errObj.message === 'string') {
      message = errObj.message;
    }

    // 3. DRF { "non_field_errors": ["..."] }
    if (Array.isArray(errObj.non_field_errors) && errObj.non_field_errors.length > 0) {
      message = String(errObj.non_field_errors[0]);
      fieldErrors['non_field_errors'] = errObj.non_field_errors.map(String);
    }

    // 4. Field-level validation errors { "email": ["..."], "password": ["..."] }
    let hasFieldErrors = false;
    for (const [key, value] of Object.entries(errObj)) {
      if (['detail', 'message', 'status', 'statusCode'].includes(key)) {
        continue;
      }

      if (Array.isArray(value)) {
        const errorStrings = value.map((v) => (typeof v === 'string' ? v : JSON.stringify(v)));
        fieldErrors[key] = errorStrings;
        hasFieldErrors = true;
        // If message is still default, pick first field error for context
        if (message === 'An unexpected error occurred. Please try again.') {
          message = `${formatFieldName(key)}: ${errorStrings[0]}`;
        }
      } else if (typeof value === 'string' && key !== 'message' && key !== 'detail') {
        fieldErrors[key] = [value];
        hasFieldErrors = true;
        if (message === 'An unexpected error occurred. Please try again.') {
          message = `${formatFieldName(key)}: ${value}`;
        }
      }
    }
  }

  // HTTP Status-specific overrides if message is still too generic
  if (status) {
    if (status === 401 && message === 'An unexpected error occurred. Please try again.') {
      message = 'Your session has expired or you are unauthorized. Please sign in.';
    } else if (status === 403 && message === 'An unexpected error occurred. Please try again.') {
      message = 'You do not have permission to perform this action.';
    } else if (status === 404 && message === 'An unexpected error occurred. Please try again.') {
      message = 'The requested resource was not found.';
    } else if (status === 409 && message === 'An unexpected error occurred. Please try again.') {
      message = 'A conflict occurred with the current state of the resource.';
    } else if (status === 429) {
      message = 'Too many requests. Please pause a moment before retrying.';
    } else if (status >= 500) {
      message = 'The atelier backend encountered an internal error. Please try again shortly.';
    }
  }

  return {
    message,
    fieldErrors,
    status,
    raw: error,
  };
}

function formatFieldName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
