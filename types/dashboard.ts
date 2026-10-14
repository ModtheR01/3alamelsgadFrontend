export interface InstaPayWallet {
  address?: string;
  number?: string;
}

export type PaymentWalletValue = string | InstaPayWallet;

export interface PaymentWallets {
  mobile_wallet?: string;
  vodafone_cash?: string;
  instapay?: InstaPayWallet | string;
  [key: string]: PaymentWalletValue | undefined;
}

export interface DashboardSettings {
  id?: number;
  deposit_percentage?: string | number;
  payment_wallets?: PaymentWallets | Record<string, any> | null;
  phone?: string;
  whatsapp?: string;
  address?: string;
  updated_at?: string;
}

export interface DashboardSettingsPatch {
  deposit_percentage?: string | number;
  // A key or nested sub_key set to `null` deletes that wallet server-side; omitted keys are left untouched.
  payment_wallets?: Record<string, any>;
  phone?: string;
  whatsapp?: string;
  address?: string;
}
