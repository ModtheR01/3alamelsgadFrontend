/**
 * API Configuration
 * Supports switching between Mock API Mode and Real API Mode via environment or runtime.
 */

export type ApiMode = 'mock' | 'real';

const ENV_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
const ENV_API_MODE = (process.env.NEXT_PUBLIC_API_MODE as ApiMode) || 'mock';

class ApiConfig {
  private baseUrl: string = ENV_API_URL;
  private mode: ApiMode = ENV_API_MODE;
  private listeners: Set<(mode: ApiMode) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      const storedMode = localStorage.getItem('tocco_api_mode') as ApiMode | null;
      if (storedMode === 'mock' || storedMode === 'real') {
        this.mode = storedMode;
      }
      const storedUrl = localStorage.getItem('tocco_api_url');
      if (storedUrl) {
        this.baseUrl = storedUrl;
      }
    }
  }

  getBaseUrl(): string {
    return this.baseUrl.replace(/\/+$/, '');
  }

  setBaseUrl(url: string) {
    this.baseUrl = url;
    if (typeof window !== 'undefined') {
      localStorage.setItem('tocco_api_url', url);
    }
  }

  getMode(): ApiMode {
    return this.mode;
  }

  setMode(mode: ApiMode) {
    this.mode = mode;
    if (typeof window !== 'undefined') {
      localStorage.setItem('tocco_api_mode', mode);
    }
    this.listeners.forEach((listener) => listener(mode));
  }

  isMock(): boolean {
    return this.mode === 'mock';
  }

  subscribe(listener: (mode: ApiMode) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const apiConfig = new ApiConfig();
