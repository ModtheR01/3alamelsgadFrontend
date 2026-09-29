import { apiClient } from '../client';
import { PaginatedResponse, SearchParams, unwrapResults } from '../pagination';
import {
  ProfileResponse,
  ProfileUpdateRequest,
  ProfileUpdateResponse,
  UserManagementUser,
  UserRole,
  ChangeUserRoleResponse,
  ChangeUserStatusResponse,
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
   * List all registered users, optionally filtered with `?search=`
   * (matches email, phone, first/last name). Admin only.
   * GET /user/users/
   */
  async listUsers(params: SearchParams = {}): Promise<UserManagementUser[]> {
    const response = await apiClient.get<PaginatedResponse<UserManagementUser>>('/user/users/', {
      params: { page_size: 100, ...params },
    });
    return unwrapResults<UserManagementUser>(response);
  },

  /**
   * Update user role (Admin only)
   * PATCH /user/users/<user_id>/role/
   */
  async changeUserRole(userId: number, role: UserRole): Promise<ChangeUserRoleResponse> {
    return apiClient.patch<ChangeUserRoleResponse>(`/user/users/${userId}/role/`, { role });
  },

  /**
   * Activate/deactivate a user (Admin only)
   * PATCH /user/users/<user_id>/status/
   */
  async changeUserStatus(userId: number, isActive: boolean): Promise<ChangeUserStatusResponse> {
    return apiClient.patch<ChangeUserStatusResponse>(`/user/users/${userId}/status/`, {
      is_active: isActive,
    });
  },
};
