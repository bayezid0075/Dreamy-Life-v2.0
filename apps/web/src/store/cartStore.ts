import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  vendorPrice: number;
  image?: string;
  shopName: string;
  quantity: number;
  resellerPrice: number;
  customerName?: string;
  customerPhone?: string;
  customerAltPhone?: string;
  customerAddress?: string;
  paymentMethod?: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity' | 'resellerPrice'>) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateResellerPrice: (productId: string, resellerPrice: number) => void;
  updateCustomerInfo: (productId: string, info: Partial<Pick<CartItem, 'customerName' | 'customerPhone' | 'customerAltPhone' | 'customerAddress' | 'paymentMethod'>>) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalCost: () => number;
  getTotalProfit: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        set((state) => {
          const existing = state.items.find(i => i.productId === item.productId);
          if (existing) {
            return {
              items: state.items.map(i =>
                i.productId === item.productId ? { ...i, quantity: i.quantity + 1 } : i
              ),
            };
          }
          return {
            items: [...state.items, { ...item, quantity: 1, resellerPrice: item.price }],
          };
        });
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter(i => i.productId !== productId),
        }));
      },

      updateQuantity: (productId, quantity) => {
        if (quantity < 1) return get().removeItem(productId);
        set((state) => ({
          items: state.items.map(i =>
            i.productId === productId ? { ...i, quantity } : i
          ),
        }));
      },

      updateResellerPrice: (productId, resellerPrice) => {
        set((state) => ({
          items: state.items.map(i =>
            i.productId === productId ? { ...i, resellerPrice } : i
          ),
        }));
      },

      updateCustomerInfo: (productId, info) => {
        set((state) => ({
          items: state.items.map(i =>
            i.productId === productId ? { ...i, ...info } : i
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getTotalCost: () => {
        return get().items.reduce((sum, item) => sum + item.vendorPrice * item.quantity, 0);
      },

      getTotalProfit: () => {
        return get().items.reduce((sum, item) => sum + (item.resellerPrice - item.vendorPrice) * item.quantity, 0);
      },
    }),
    {
      name: 'dreamy-life-cart',
    }
  )
);
