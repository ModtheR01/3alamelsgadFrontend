export interface DashboardSettings {
  id: number;
  deposit_percentage: string | number;
  payment_wallets: Record<string, string>;
  updated_at: string;
}

export interface DashboardSettingsPatch {
  deposit_percentage?: string | number;
  // A key set to `null` deletes that wallet server-side; omitted keys are left untouched.
  payment_wallets?: Record<string, string | null>;
}
