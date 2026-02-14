import { z } from 'zod';

export const paymentMethodSchema = z.enum(['wallet', 'mobile_banking', 'cash_on_delivery'], {
  message: 'Please select a payment method',
});

export const orderSchema = z.object({
  customer_name: z.string().min(1, 'Customer name is required'),
  customer_email: z.string().email('Invalid email address'),
  customer_phone: z.string().min(1, 'Phone number is required'),
  delivery_address: z.string().min(1, 'Delivery address is required'),
  delivery_area: z.enum(['inside_dhaka', 'outside_dhaka'], {
    message: 'Please select a delivery area',
  }),
  apply_reseller_price: z.boolean().optional(),
  payment_method: paymentMethodSchema,
  delivery_payment_method: z.enum(['wallet']).optional(),
}).refine(
  (data) => {
    if (data.payment_method !== 'cash_on_delivery') return true;
    return data.delivery_payment_method === 'wallet';
  },
  { message: 'For Cash on Delivery, pay delivery charge via Wallet.', path: ['delivery_payment_method'] }
);

export type OrderFormData = z.infer<typeof orderSchema>;
