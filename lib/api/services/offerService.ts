import { apiClient } from '../client';
import {
  BackendOffer,
  OfferCreateRequest,
  OfferUpdateRequest,
} from '@/types/offer';

export const offerService = {
  async getOffers(): Promise<BackendOffer[]> {
    return apiClient.get<BackendOffer[]>('/offers/');
  },

  async getOffer(id: number): Promise<BackendOffer> {
    return apiClient.get<BackendOffer>(`/offers/${id}/`);
  },

  async createOffer(data: OfferCreateRequest): Promise<BackendOffer> {
    return apiClient.post<BackendOffer>('/offers/', data);
  },

  async updateOffer(id: number, data: OfferUpdateRequest): Promise<BackendOffer> {
    return apiClient.patch<BackendOffer>(`/offers/${id}/`, data);
  },

  async deleteOffer(id: number): Promise<void> {
    await apiClient.delete<void>(`/offers/${id}/`);
  },
};
