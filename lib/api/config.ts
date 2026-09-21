/**
 * API Configuration
 * Production API configuration.
 */

const ENV_API_URL = process.env.NEXT_PUBLIC_API_URL || '';

class ApiConfig {
  private baseUrl: string = ENV_API_URL;

  getBaseUrl(): string {
    const normalized = this.baseUrl.replace(/\/+$/, '');
    if (!normalized) {
      throw new Error('NEXT_PUBLIC_API_URL is required for production API requests.');
    }
    return normalized;
  }

  setBaseUrl(url: string) {
    this.baseUrl = url;
  }
}

export const apiConfig = new ApiConfig();
