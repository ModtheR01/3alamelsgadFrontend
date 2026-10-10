import { cookies } from 'next/headers';

const RAW_TARGET =
  process.env.API_PROXY_TARGET || (process.env.NODE_ENV !== 'production' ? 'http://127.0.0.1:8000' : '');
const API_PROXY_TARGET = RAW_TARGET ? RAW_TARGET.replace(/\/+$/, '').replace(/\/api$/, '') : '';

export interface AdminAuthCheckResult {
  authorized: boolean;
  status: number;
  user?: {
    id: number;
    email: string;
    role?: string;
    first_name?: string;
    last_name?: string;
  };
  message?: string;
}

/**
 * Validates whether the incoming request has valid session credentials
 * representing an ADMIN or MODERATOR user by verifying against the backend /api/auth/me/.
 *
 * Designed for Next.js 15 Server Components and route handlers.
 * Never allows client headers to bypass verification.
 */
export async function checkServerAdminAuth(
  cookieHeaderOverride?: string,
  fetchFn: typeof fetch = fetch
): Promise<AdminAuthCheckResult> {
  let cookieHeader = cookieHeaderOverride;

  if (cookieHeader === undefined) {
    try {
      const cookieStore = await cookies();
      cookieHeader = cookieStore
        .getAll()
        .map((c) => `${c.name}=${c.value}`)
        .join('; ');
    } catch {
      cookieHeader = '';
    }
  }

  // Reject anonymous requests immediately
  if (!cookieHeader) {
    return {
      authorized: false,
      status: 401,
      message: 'Authentication required. No session cookie found.',
    };
  }

  if (!API_PROXY_TARGET) {
    return {
      authorized: false,
      status: 500,
      message: 'Backend proxy target is not configured.',
    };
  }

  try {
    const meResponse = await fetchFn(`${API_PROXY_TARGET}/api/auth/me/`, {
      method: 'GET',
      headers: {
        cookie: cookieHeader,
      },
      cache: 'no-store',
    });

    if (meResponse.status === 401) {
      return {
        authorized: false,
        status: 401,
        message: 'Session expired or invalid.',
      };
    }

    if (meResponse.status === 403) {
      return {
        authorized: false,
        status: 403,
        message: 'Forbidden. Admin privileges required.',
      };
    }

    if (!meResponse.ok) {
      return {
        authorized: false,
        status: meResponse.status,
        message: 'Authentication verification failed.',
      };
    }

    const userData = (await meResponse.json()) as {
      id: number;
      email: string;
      role?: string;
      first_name?: string;
      last_name?: string;
    };

    if (userData.role === 'ADMIN' || userData.role === 'MODERATOR') {
      return {
        authorized: true,
        status: 200,
        user: userData,
      };
    }

    return {
      authorized: false,
      status: 403,
      user: userData,
      message: 'Forbidden. User role is not ADMIN or MODERATOR.',
    };
  } catch {
    return {
      authorized: false,
      status: 503,
      message: 'Backend authentication service unavailable.',
    };
  }
}
