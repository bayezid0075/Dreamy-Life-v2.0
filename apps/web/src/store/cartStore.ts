import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  productId: string;
  name: string;
  actualPrice: number;
  discountPrice?: number;
  vendorPrice: number;
  image?: string;
  shopName: string;
  quantity: number;
  resellerPrice: number;
  deliveryChargeInside?: number;
  deliveryChargeOutside?: number;
  deliveryMethod?: 'inside' | 'outside';
  deliveryCharge: number;
  deliveryPaymentMethod?: 'funds' | 'gateway';
  customerName?: string;
  customerPhone?: string;
  customerAltPhone?: string;
  customerAddress?: string;
  paymentMethod?: string;
  selectedSize?: string;
  selectedColor?: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity' | 'deliveryCharge'> & { resellerPrice?: number }) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateResellerPrice: (productId: string, resellerPrice: number) => void;
  updateDeliveryMethod: (productId: string, deliveryMethod: 'inside' | 'outside') => void;
  updateDeliveryPaymentMethod: (productId: string, deliveryPaymentMethod: 'funds' | 'gateway') => void;
  updateCustomerInfo: (productId: string, info: Partial<Pick<CartItem, 'customerName' | 'customerPhone' | 'customerAltPhone' | 'customerAddress' | 'paymentMethod'>>) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalCost: () => number;
  getTotalProfit: () => number;
  getTotalDeliveryCharge: () => number;
}

function computeDeliveryCharge(item: CartItem): number {
  if (!item.deliveryMethod) return 0;
  if (item.deliveryMethod === 'inside') return item.deliveryChargeInside || 0;
  return item.deliveryChargeOutside || 0;
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
            items: [...state.items, { ...item, quantity: 1, resellerPrice: item.resellerPrice || 0, deliveryCharge: 0 }],
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

      updateDeliveryMethod: (productId, deliveryMethod) => {
        set((state) => ({
          items: state.items.map(i => {
            if (i.productId !== productId) return i;
            const updated = { ...i, deliveryMethod };
            updated.deliveryCharge = computeDeliveryCharge(updated);
            return updated;
          }),
        }));
      },

      updateDeliveryPaymentMethod: (productId, deliveryPaymentMethod) => {
        set((state) => ({
          items: state.items.map(i =>
            i.productId === productId ? { ...i, deliveryPaymentMethod } : i
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

      getTotalDeliveryCharge: () => {
        return get().items.reduce((sum, item) => sum + item.deliveryCharge * item.quantity, 0);
      },
    }),
    {
      name: 'dreamy-life-cart',
    }
  )
);
