import { apiClient } from '../client';
import {
  DashboardSettings,
  DashboardSettingsPatch,
} from '@/types/dashboard';

export const dashboardService = {
  async getSettings(): Promise<DashboardSettings> {
    return apiClient.get<DashboardSettings>('/dashboard/settings/');
  },

  async updateSettings(data: DashboardSettingsPatch): Promise<DashboardSettings> {
    return apiClient.patch<DashboardSettings>('/dashboard/settings/', data);
  },
};
