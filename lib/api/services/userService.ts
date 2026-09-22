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
   * GET /user/profile/
   */
  async getProfile(): Promise<ProfileResponse> {
    return apiClient.get<ProfileResponse>('/user/profile/');
  },

  /**
   * Update client profile (first_name, last_name, phone)
   * Note: email is read-only
   * PUT /user/profile/ or PATCH /user/profile/
   */
  async updateProfile(
    data: ProfileUpdateRequest,
    method: 'PUT' | 'PATCH' = 'PUT'
  ): Promise<ProfileUpdateResponse> {
    if (method === 'PATCH') {
      return apiClient.patch<ProfileUpdateResponse>('/user/profile/', data);
    }
    return apiClient.put<ProfileUpdateResponse>('/user/profile/', data);
  },

  /**
   * Soft delete client account
   * DELETE /user/profile/
   */
  async deleteProfile(): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>('/user/profile/');
  },

  /**
   * List all registered users (Admin only)
   * GET /user/users/
   */
  async listUsers(): Promise<UserManagementUser[]> {
    return apiClient.get<UserManagementUser[]>('/user/users/');
  },

  /**
   * Update user role (Admin only)
   * PATCH /user/users/<user_id>/role/
   */
  async changeUserRole(userId: number, role: UserRole): Promise<ChangeUserRoleResponse> {
    return apiClient.patch<ChangeUserRoleResponse>(`/user/users/${userId}/role/`, { role });
  },
};
