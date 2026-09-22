import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Converts a local Egyptian number (e.g. "01080182663") or "00"-prefixed
// international number into the country-code-qualified digits wa.me requires.
export function toWhatsAppNumber(phone: string | null | undefined): string {
  const digits = (phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('00')) return digits.slice(2);
  if (digits.startsWith('0')) return `20${digits.slice(1)}`;
  if (digits.startsWith('20')) return digits;
  return `20${digits}`;
}
