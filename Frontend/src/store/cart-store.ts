import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Product } from '@/types';

export interface CartItem {
  product: Product;
  quantity: number;
  resellerPrice: string;
}

interface CartState {
  items: CartItem[];
  /** Product IDs selected for checkout (reseller cart) */
  selectedProductIds: number[];
  addItem: (product: Product, quantity?: number, resellerPrice?: string) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  updateResellerPrice: (productId: number, price: string) => void;
  clearCart: () => void;
  setItemSelected: (productId: number, selected: boolean) => void;
  toggleItemSelected: (productId: number) => void;
  selectAll: () => void;
  deselectAll: () => void;
  getSelectedItems: () => CartItem[];
  removeItemsByIds: (productIds: number[]) => void;
  getItemCount: () => number;
  getSubtotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      selectedProductIds: [],

      addItem: (product, quantity = 1, resellerPrice?) => {
        const items = get().items;
        const defaultPrice = resellerPrice || product.reseller_mrp_price || product.discount_price || product.price;
        const existingItem = items.find((item) => item.product.id === product.id);

        if (existingItem) {
          set({
            items: items.map((item) =>
              item.product.id === product.id
                ? { ...item, quantity: item.quantity + quantity, resellerPrice: resellerPrice || item.resellerPrice }
                : item
            ),
          });
        } else {
          const nextItems = [...items, { product, quantity, resellerPrice: defaultPrice }];
          const selected = get().selectedProductIds ?? [];
          const nextSelected = selected.includes(product.id) ? selected : [...selected, product.id];
          set({ items: nextItems, selectedProductIds: nextSelected });
        }
      },

      removeItem: (productId) => {
        set({
          items: get().items.filter((item) => item.product.id !== productId),
          selectedProductIds: (get().selectedProductIds ?? []).filter((id) => id !== productId),
        });
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }

        set({
          items: get().items.map((item) =>
            item.product.id === productId ? { ...item, quantity } : item
          ),
        });
      },

      updateResellerPrice: (productId, price) => {
        set({
          items: get().items.map((item) =>
            item.product.id === productId ? { ...item, resellerPrice: price } : item
          ),
        });
      },

      clearCart: () => set({ items: [], selectedProductIds: [] }),

      setItemSelected: (productId, selected) => {
        const current = get().selectedProductIds ?? [];
        const next = selected
          ? (current.includes(productId) ? current : [...current, productId])
          : current.filter((id) => id !== productId);
        set({ selectedProductIds: next });
      },

      toggleItemSelected: (productId) => {
        const current = get().selectedProductIds ?? [];
        const next = current.includes(productId)
          ? current.filter((id) => id !== productId)
          : [...current, productId];
        set({ selectedProductIds: next });
      },

      selectAll: () => {
        const ids = get().items.map((item) => item.product.id);
        set({ selectedProductIds: ids });
      },

      deselectAll: () => set({ selectedProductIds: [] }),

      getSelectedItems: () => {
        const { items } = get();
        const selectedIds = get().selectedProductIds ?? [];
        const idSet = new Set(selectedIds);
        return items.filter((item) => idSet.has(item.product.id));
      },

      removeItemsByIds: (productIds) => {
        const ids = new Set(productIds);
        set({
          items: get().items.filter((item) => !ids.has(item.product.id)),
          selectedProductIds: (get().selectedProductIds ?? []).filter((id) => !ids.has(id)),
        });
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce((total, item) => {
          const price = parseFloat(item.resellerPrice || item.product.discount_price || item.product.price);
          return total + price * item.quantity;
        }, 0);
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined') {
          return localStorage;
        }
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
      merge: (persisted, current) => {
        const p = persisted as { items?: CartItem[]; selectedProductIds?: number[] } | undefined;
        const selected =
          p?.selectedProductIds != null && Array.isArray(p.selectedProductIds)
            ? p.selectedProductIds
            : (p?.items ?? []).map((i) => i.product.id);
        return { ...current, ...p, selectedProductIds: selected };
      },
    }
  )
);
