import { apiClient } from '../client';
import { PaginatedResponse } from '../pagination';
import {
  BackendEvent,
  EventCreateRequest,
  EventUpdateRequest,
} from '@/types/event';

export const eventService = {
  async getEvents(): Promise<BackendEvent[]> {
    const response = await apiClient.get<PaginatedResponse<BackendEvent>>('/events/', {
      params: { page_size: 100 },
    });
    return response.results;
  },

  async getEvent(id: number): Promise<BackendEvent> {
    return apiClient.get<BackendEvent>(`/events/${id}/`);
  },

  async createEvent(data: EventCreateRequest): Promise<BackendEvent> {
    return apiClient.post<BackendEvent>('/events/', data);
  },

  async updateEvent(id: number, data: EventUpdateRequest): Promise<BackendEvent> {
    return apiClient.patch<BackendEvent>(`/events/${id}/`, data);
  },

  async deleteEvent(id: number): Promise<void> {
    await apiClient.delete<void>(`/events/${id}/`);
  },
};
