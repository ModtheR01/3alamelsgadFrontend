import { apiClient } from '../client';
import { PaginatedResponse, unwrapResults } from '../pagination';
import { BackendSpaceProject, SpaceProjectRequest } from '@/types/spaceProject';

export const spaceProjectService = {
  async getProjects(): Promise<BackendSpaceProject[]> {
    const response = await apiClient.get<PaginatedResponse<BackendSpaceProject>>('/space-projects/', {
      params: { page_size: 100 },
    });
    return unwrapResults<BackendSpaceProject>(response);
  },

  async createProject(data: SpaceProjectRequest): Promise<BackendSpaceProject> {
    return apiClient.post<BackendSpaceProject>('/space-projects/', data);
  },

  async updateProject(id: number, data: SpaceProjectRequest): Promise<BackendSpaceProject> {
    return apiClient.patch<BackendSpaceProject>(`/space-projects/${id}/`, data);
  },

  async deleteProject(id: number): Promise<void> {
    await apiClient.delete<void>(`/space-projects/${id}/`);
  },
};