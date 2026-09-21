import { apiClient } from '../client';
import {
  ProfileResponse,
  ProfileUpdateRequest,
  ProfileUpdateResponse,
  UserManagementUser,
  UserRole,
  ChangeUserRoleResponse,
} from '@/types/auth';

export const userService = {
  /**
   * Get client profile details
   * GET /users/profile/
   */
  async getProfile(): Promise<ProfileResponse> {
    return apiClient.get<ProfileResponse>('/users/profile/');
  },

  /**
   * Update client profile (first_name, last_name, phone)
   * Note: email is read-only
   * PUT /users/profile/ or PATCH /users/profile/
   */
  async updateProfile(
    data: ProfileUpdateRequest,
    method: 'PUT' | 'PATCH' = 'PUT'
  ): Promise<ProfileUpdateResponse> {
    if (method === 'PATCH') {
      return apiClient.patch<ProfileUpdateResponse>('/users/profile/', data);
    }
    return apiClient.put<ProfileUpdateResponse>('/users/profile/', data);
  },

  /**
   * Soft delete client account
   * DELETE /users/profile/
   */
  async deleteProfile(): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>('/users/profile/');
  },

  /**
   * List all registered users (Admin only)
   * GET /users/
   */
  async listUsers(): Promise<UserManagementUser[]> {
    return apiClient.get<UserManagementUser[]>('/users/');
  },

  /**
   * Update user role (Admin only)
   * PATCH /users/<user_id>/role/
   */
  async changeUserRole(userId: number, role: UserRole): Promise<ChangeUserRoleResponse> {
    return apiClient.patch<ChangeUserRoleResponse>(`/users/${userId}/role/`, { role });
  },
};
