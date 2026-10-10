import crypto from 'node:crypto';

const RAW_TARGET =
  process.env.API_PROXY_TARGET || (process.env.NODE_ENV !== 'production' ? 'http://127.0.0.1:8000' : '');
const API_PROXY_TARGET = RAW_TARGET ? RAW_TARGET.replace(/\/+$/, '').replace(/\/api$/, '') : '';

/**
 * Builds a deterministic SHA-1 signature for Cloudinary upload parameters.
 */
export function buildSignature(params: Record<string, string>, apiSecret: string): string {
  const signatureBase = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');
  return crypto.createHash('sha1').update(`${signatureBase}${apiSecret}`).digest('hex');
}

/**
 * Whitelist of permitted Cloudinary upload folders.
 * Uploads outside this list are rejected with HTTP 400.
 */
export const ALLOWED_CLOUDINARY_FOLDERS = [
  'alamelsgad-products',
  'alamelsgad-categories',
  'alamelsgad-subcategories',
] as const;

export type AllowedCloudinaryFolder = (typeof ALLOWED_CLOUDINARY_FOLDERS)[number];

export function isAllowedCloudinaryFolder(folder: unknown): folder is AllowedCloudinaryFolder {
  return typeof folder === 'string' && (ALLOWED_CLOUDINARY_FOLDERS as readonly string[]).includes(folder);
}

/**
 * Sanitizes the requested folder path to prevent directory traversal or invalid characters.
 */
export function sanitizeFolder(rawFolder: unknown, defaultFolder: string = 'alamelsgad-products'): string {
  if (typeof rawFolder !== 'string') return defaultFolder;
  const trimmed = rawFolder.trim();
  if (!trimmed) return defaultFolder;
  const sanitized = trimmed
    .replace(/[^a-zA-Z0-9_\-\/]/g, '')
    .replace(/\/+/g, '/')
    .replace(/^\/|\/$/g, '');
  return sanitized || defaultFolder;
}

/**
 * Verifies that the caller has administrative privileges.
 * Checks request session cookies/tokens against backend /api/auth/me/.
 * Never allows client-supplied headers (e.g. x-test-admin) to bypass verification.
 */
export async function verifyAdminAuthorization(
  request: Request,
  fetchFn: typeof fetch = fetch
): Promise<{ authorized: boolean; status?: number; message?: string }> {
  const cookieHeader = request.headers.get('cookie') || '';
  const authHeader = request.headers.get('authorization') || '';

  // Reject anonymous requests immediately (even if client sends x-test-admin)
  if (!cookieHeader && !authHeader) {
    return {
      authorized: false,
      status: 401,
      message: 'Authentication required. Please sign in as an administrator to upload images.',
    };
  }

  if (!API_PROXY_TARGET) {
    return {
      authorized: false,
      status: 500,
      message: 'Backend proxy target is not configured to verify authentication.',
    };
  }

  try {
    const meResponse = await fetchFn(`${API_PROXY_TARGET}/api/auth/me/`, {
      method: 'GET',
      headers: {
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
        ...(authHeader ? { authorization: authHeader } : {}),
      },
      cache: 'no-store',
    });

    if (meResponse.status === 401) {
      return {
        authorized: false,
        status: 401,
        message: 'Authentication session expired or invalid. Please sign in again.',
      };
    }

    if (meResponse.status === 403) {
      return {
        authorized: false,
        status: 403,
        message: 'Forbidden. Admin privileges required to upload assets.',
      };
    }

    if (!meResponse.ok) {
      return {
        authorized: false,
        status: 403,
        message: 'Failed to verify admin status with authentication server.',
      };
    }

    const userData = (await meResponse.json()) as { role?: string };
    if (userData.role !== 'ADMIN' && userData.role !== 'MODERATOR') {
      return {
        authorized: false,
        status: 403,
        message: 'Forbidden: Admin or Moderator role required to upload images.',
      };
    }

    return { authorized: true };
  } catch {
    return {
      authorized: false,
      status: 503,
      message: 'Authentication verification service temporarily unavailable.',
    };
  }
}
