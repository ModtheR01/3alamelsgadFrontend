export interface DashboardSettings {
  id: number;
  deposit_percentage: string | number;
  payment_wallets: Record<string, string>;
  updated_at: string;
}

export interface DashboardSettingsPatch {
  deposit_percentage?: string | number;
  payment_wallets?: Record<string, string>;
}
