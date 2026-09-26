/**
 * Guest (unauthenticated) shopping cart, persisted in localStorage.
 *
 * When a signed-out visitor adds a product to the cart, the request to the
 * real backend cart fails with 401. Instead of losing the item, it is kept
 * here and merged into the real backend cart once the visitor signs in
 * (see `syncGuestCart` in lib/store.tsx).
 */
import { CartItem } from '@/types';

const STORAGE_KEY = 'tocco_guest_cart_v1';
const GUEST_ID_PREFIX = 'guest-';

function readCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCart(items: CartItem[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage unavailable (private browsing quota, etc.) - guest cart just won't persist.
  }
}

export function isGuestCartItemId(id: string): boolean {
  return id.startsWith(GUEST_ID_PREFIX);
}

export function getGuestCart(): CartItem[] {
  return readCart();
}

export function addGuestCartItem(item: Omit<CartItem, 'id'>): CartItem[] {
  const items = readCart();
  const existing = items.find(
    (i) =>
      i.productId === item.productId &&
      i.selectedColor.id === item.selectedColor.id &&
      i.selectedFinish === item.selectedFinish &&
      i.selectedSize?.id === item.selectedSize?.id
  );

  if (existing) {
    existing.quantity += item.quantity;
    existing.subtotal = existing.unitPrice * existing.quantity;
  } else {
    items.push({
      ...item,
      id: `${GUEST_ID_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      subtotal: item.unitPrice * item.quantity,
    });
  }

  writeCart(items);
  return items;
}

export function removeGuestCartItem(id: string): CartItem[] {
  const items = readCart().filter((i) => i.id !== id);
  writeCart(items);
  return items;
}

export function updateGuestCartItemQuantity(id: string, quantity: number): CartItem[] {
  let items = readCart();
  if (quantity <= 0) {
    items = items.filter((i) => i.id !== id);
  } else {
    items = items.map((i) => (i.id === id ? { ...i, quantity, subtotal: i.unitPrice * quantity } : i));
  }
  writeCart(items);
  return items;
}

export function clearGuestCart(): void {
  writeCart([]);
}
