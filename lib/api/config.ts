/**
 * API Configuration
 * Defaults to the same-origin "/api" proxy (see app/api/[...path]/route.ts)
 * so auth cookies stay first-party in the browser - required for the
 * checkout flow to survive Facebook/Instagram in-app browsers and Safari,
 * which drop cross-site cookies. Only set NEXT_PUBLIC_API_URL to call the
 * backend directly (e.g. local dev without running the proxy).
 */

const ENV_API_URL = process.env.NODE_ENV === 'production'
  ? '/api'
  : process.env.NEXT_PUBLIC_API_URL || '/api';

class ApiConfig {
  private baseUrl: string = ENV_API_URL;

  getBaseUrl(): string {
    return this.baseUrl.replace(/\/+$/, '');
  }

  setBaseUrl(url: string) {
    this.baseUrl = url;
  }
}

export const apiConfig = new ApiConfig();
