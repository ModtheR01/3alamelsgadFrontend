import { apiClient } from '../client';
import {
  Address,
  AddressCreateRequest,
  AddressUpdateRequest,
  SetDefaultAddressResponse,
} from '@/types/auth';

export const addressService = {
  /**
   * Get all delivery addresses for the authenticated user
   * GET /users/addresses/
   */
  async getAddresses(): Promise<Address[]> {
    return apiClient.get<Address[]>('/users/addresses/');
  },

  /**
   * Create a new delivery address
   * POST /users/addresses/
   */
  async createAddress(data: AddressCreateRequest): Promise<Address> {
    return apiClient.post<Address>('/users/addresses/', data);
  },

  /**
   * Get a single address by ID
   * GET /users/addresses/<id>/
   */
  async getAddress(id: number): Promise<Address> {
    return apiClient.get<Address>(`/users/addresses/${id}/`);
  },

  /**
   * Update an existing address
   * PUT /users/addresses/<id>/ or PATCH /users/addresses/<id>/
   */
  async updateAddress(
    id: number,
    data: AddressUpdateRequest,
    method: 'PUT' | 'PATCH' = 'PUT'
  ): Promise<Address> {
    if (method === 'PATCH') {
      return apiClient.patch<Address>(`/users/addresses/${id}/`, data);
    }
    return apiClient.put<Address>(`/users/addresses/${id}/`, data);
  },

  /**
   * Delete an address
   * DELETE /users/addresses/<id>/
   */
  async deleteAddress(id: number): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/users/addresses/${id}/`);
  },

  /**
   * Set an address as the default delivery residence
   * PUT /users/addresses/<id>/set-default/
   */
  async setDefaultAddress(id: number): Promise<SetDefaultAddressResponse> {
    return apiClient.put<SetDefaultAddressResponse>(`/users/addresses/${id}/set-default/`, {});
  },
};
