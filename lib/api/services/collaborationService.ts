import { apiClient } from '../client';
import { PaginatedResponse } from '../pagination';
import {
  BackendCollaboration,
  CollaborationCreateRequest,
} from '@/types/collaboration';

export const collaborationService = {
  async getCollaborations(): Promise<BackendCollaboration[]> {
    const response = await apiClient.get<PaginatedResponse<BackendCollaboration>>('/collaborations/', {
      params: { page_size: 100 },
    });
    return response.results;
  },

  async getCollaboration(id: number): Promise<BackendCollaboration> {
    return apiClient.get<BackendCollaboration>(`/collaborations/${id}/`);
  },

  async createCollaboration(data: CollaborationCreateRequest): Promise<BackendCollaboration> {
    return apiClient.post<BackendCollaboration>('/collaborations/', data);
  },

  async deleteCollaboration(id: number): Promise<void> {
    await apiClient.delete<void>(`/collaborations/${id}/`);
  },
};
