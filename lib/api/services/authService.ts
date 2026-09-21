import { apiClient } from '../client';
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  RefreshResponse,
  LogoutResponse,
  BackendUser,
} from '@/types/auth';

export const authService = {
  /**
   * Register a new user account
   * POST /auth/register/
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/auth/register/', data, { skipAuthRefresh: true });
  },

  /**
   * Log into an existing user account
   * POST /auth/login/
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/auth/login/', data, { skipAuthRefresh: true });
  },

  /**
   * Manually trigger token refresh
   * POST /auth/refresh/ (reads HttpOnly refresh cookie)
   */
  async refresh(): Promise<RefreshResponse> {
    return apiClient.post<RefreshResponse>('/auth/refresh/', {}, { skipAuthRefresh: true });
  },

  /**
   * Log out current user session
   * POST /auth/logout/
   */
  async logout(): Promise<LogoutResponse> {
    return apiClient.post<LogoutResponse>('/auth/logout/', {}, { skipAuthRefresh: true });
  },

  /**
   * Get currently authenticated user details
   * GET /auth/me/
   */
  async getCurrentUser(): Promise<BackendUser> {
    return apiClient.get<BackendUser>('/auth/me/');
  },
};
