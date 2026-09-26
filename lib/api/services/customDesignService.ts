import { apiClient } from '../client';
import { PaginatedResponse, SearchParams } from '../pagination';
import {
  CustomDesignImage,
  CustomDesignImageCreate,
  CustomDesignRequest,
  CustomDesignRequestCreate,
} from '@/types/customDesign';

export const customDesignService = {
  async createRequest(data: CustomDesignRequestCreate): Promise<CustomDesignRequest> {
    return apiClient.post<CustomDesignRequest>('/custom-designs/', data);
  },

  async createImage(data: CustomDesignImageCreate): Promise<CustomDesignImage> {
    return apiClient.post<CustomDesignImage>('/custom-designs/images/', data);
  },

  async getRequests(params: SearchParams = {}): Promise<CustomDesignRequest[]> {
    const response = await apiClient.get<PaginatedResponse<CustomDesignRequest>>('/custom-designs/', {
      params: { page_size: 100, ...params },
    });
    return response.results;
  },

  async deleteRequest(id: number): Promise<void> {
    await apiClient.delete<void>(`/custom-designs/${id}/`);
  },
};