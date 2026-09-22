import { apiClient } from '../client';
import { BackendSpaceProject, SpaceProjectRequest } from '@/types/spaceProject';

export const spaceProjectService = {
  async getProjects(): Promise<BackendSpaceProject[]> {
    return apiClient.get<BackendSpaceProject[]>('/space-projects/');
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