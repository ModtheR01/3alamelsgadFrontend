import { apiConfig } from './config';
import { normalizeApiError, ApiError } from './errors';

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: any;
  params?: Record<string, string | number | boolean | undefined>;
  skipAuthRefresh?: boolean;
}

type AuthFailureListener = () => void;

class ApiClient {
  private refreshPromise: Promise<boolean> | null = null;
  private csrfBootstrapPromise: Promise<string> | null = null;
  private authFailureListeners: Set<AuthFailureListener> = new Set();

  private readCsrfCookie(): string | null {
    if (typeof document === 'undefined') return null;
    const cookie = document.cookie
      .split(';')
      .map((entry) => entry.trim())
      .find((entry) => entry.startsWith('csrftoken='));
    return cookie ? decodeURIComponent(cookie.slice('csrftoken='.length)) : null;
  }

  
  private async getCsrfToken(): Promise<string> {
    const cookieToken = this.readCsrfCookie();
    if (cookieToken) return cookieToken;

    if (!this.csrfBootstrapPromise) {
      this.csrfBootstrapPromise = (async () => {
        const bootstrapUrl = `${apiConfig.getBaseUrl()}/auth/csrf/`;
        let response: Response;
        try {
          response = await fetch(bootstrapUrl, {
            method: 'GET',
            credentials: 'include',
            cache: 'no-store',
            headers: { Accept: 'application/json' },
          });
        } catch (err) {
          throw new ApiError(normalizeApiError(err));
        }

        if (response.status === 404) {
          throw new ApiError({
            message: 'The backend CSRF bootstrap endpoint is missing. Add GET /api/auth/csrf/ and set a readable csrftoken cookie.',
            fieldErrors: {},
            status: 404,
          });
        }

        await this.handleResponse<unknown>(response);
        const token = this.readCsrfCookie();
        if (!token) {
          throw new ApiError({
            message: 'The backend did not provide a readable csrftoken cookie. Ask the backend team to enable GET /api/auth/csrf/.',
            fieldErrors: {},
            status: 0,
          });
        }
        return token;
      })();
    }

    try {
      return await this.csrfBootstrapPromise;
    } finally {
      this.csrfBootstrapPromise = null;
    }
  }

  onAuthFailure(listener: AuthFailureListener): () => void {
    this.authFailureListeners.add(listener);
    return () => {
      this.authFailureListeners.delete(listener);
    };
  }

  private notifyAuthFailure() {
    this.authFailureListeners.forEach((fn) => {
      try {
        fn();
      } catch {
        // Ignore listener error
      }
    });
  }

  /**
   * Executes an API request with automatic token refresh on 401 Unauthorized
   */
  async request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const {
      method = 'GET',
      body,
      headers = {},
      params,
      skipAuthRefresh = false,
      ...customConfig
    } = options;

    // Normalize endpoint path with query params
    let urlPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          searchParams.append(key, String(val));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        urlPath += (urlPath.includes('?') ? '&' : '?') + queryString;
      }
    }

    const fullUrl = `${apiConfig.getBaseUrl()}${urlPath}`;

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(headers as Record<string, string>),
    };

    const normalizedMethod = String(method).toUpperCase();
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(normalizedMethod)) {
      requestHeaders['X-CSRFToken'] = await this.getCsrfToken();
    }

    const fetchConfig: RequestInit = {
      method,
      headers: requestHeaders,
      ...customConfig,
      credentials: 'include', // Strictly required: Send HttpOnly access & refresh cookies
    };

    if (body !== undefined && body !== null) {
      fetchConfig.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    try {
      const response = await fetch(fullUrl, fetchConfig);

      // Handle 401 Unauthorized for access token expiration
      if (
        response.status === 401 &&
        !skipAuthRefresh &&
        !this.isAuthEndpoint(urlPath)
      ) {
        const refreshed = await this.handleTokenRefresh();
        if (refreshed) {
          // Retry original request once
          const retryResponse = await fetch(fullUrl, fetchConfig);
          return await this.handleResponse<T>(retryResponse);
        } else {
          this.notifyAuthFailure();
          throw new ApiError({
            message: 'Session expired. Please sign in again.',
            fieldErrors: {},
            status: 401,
          });
        }
      }

      return await this.handleResponse<T>(response);
    } catch (err: any) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(normalizeApiError(err));
    }
  }

  private isAuthEndpoint(path: string): boolean {
    const clean = path.toLowerCase();
    return (
      clean.includes('/auth/refresh') ||
      clean.includes('/auth/login') ||
      clean.includes('/auth/register') ||
      clean.includes('/auth/logout')
    );
  }

  /**
   * Centralized Token Refresh Logic
   * Uses singleton promise to ensure only one refresh request runs at a time
   */
  private async handleTokenRefresh(): Promise<boolean> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        // Real backend: POST /auth/refresh/ with credentials: 'include'
        // Empty body! Refresh token is read from HttpOnly cookie by Django backend
        const refreshUrl = `${apiConfig.getBaseUrl()}/auth/refresh/`;
        const csrfToken = await this.getCsrfToken();
        const res = await fetch(refreshUrl, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-CSRFToken': csrfToken,
          },
        });

        if (res.ok) {
          return true;
        }

        if (res.status !== 401) {
          await this.handleResponse<unknown>(res);
        }

        return false;
      } catch (err) {
        if (err instanceof ApiError) throw err;
        throw new ApiError(normalizeApiError(err));
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');

    if (!response.ok) {
      let rawData: any = null;
      try {
        rawData = isJson ? await response.json() : await response.text();
      } catch {
        // Could not parse response body
      }

      const normalized = normalizeApiError(rawData, response.status);
      throw new ApiError(normalized);
    }

    if (response.status === 204) {
      return null as unknown as T;
    }

    if (isJson) {
      return (await response.json()) as T;
    }

    return (await response.text()) as unknown as T;
  }

  // Convenience methods
  get<T = any>(endpoint: string, options?: Omit<RequestOptions, 'method'>) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>) {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  put<T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>) {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  patch<T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>) {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  delete<T = any>(endpoint: string, options?: Omit<RequestOptions, 'method'>) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
