import { apiClient } from '../client';
import { PaginatedResponse } from '../pagination';
import {
  Address,
  AddressCreateRequest,
  AddressUpdateRequest,
  SetDefaultAddressResponse,
} from '@/types/auth';

export const addressService = {
  /**
   * Get all delivery addresses for the authenticated user
   * GET /user/addresses/
   */
  async getAddresses(): Promise<Address[]> {
    const response = await apiClient.get<PaginatedResponse<Address>>('/user/addresses/', {
      params: { page_size: 100 },
    });
    return response.results;
  },

  /**
   * Create a new delivery address
   * POST /user/addresses/
   */
  async createAddress(data: AddressCreateRequest): Promise<Address> {
    return apiClient.post<Address>('/user/addresses/', data);
  },

  /**
   * Get a single address by ID
   * GET /user/addresses/<id>/
   */
  async getAddress(id: number): Promise<Address> {
    return apiClient.get<Address>(`/user/addresses/${id}/`);
  },

  /**
   * Update an existing address
   * PUT /user/addresses/<id>/ or PATCH /user/addresses/<id>/
   */
  async updateAddress(
    id: number,
    data: AddressUpdateRequest,
    method: 'PUT' | 'PATCH' = 'PUT'
  ): Promise<Address> {
    if (method === 'PATCH') {
      return apiClient.patch<Address>(`/user/addresses/${id}/`, data);
    }
    return apiClient.put<Address>(`/user/addresses/${id}/`, data);
  },

  /**
   * Delete an address
   * DELETE /user/addresses/<id>/
   */
  async deleteAddress(id: number): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/user/addresses/${id}/`);
  },

  /**
   * Set an address as the default delivery residence
   * PUT /user/addresses/<id>/set-default/
   */
  async setDefaultAddress(id: number): Promise<SetDefaultAddressResponse> {
    return apiClient.put<SetDefaultAddressResponse>(`/user/addresses/${id}/set-default/`, {});
  },
};
