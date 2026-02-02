import { z } from 'zod';

export const orderSchema = z.object({
  customer_name: z.string().min(1, 'Customer name is required'),
  customer_email: z.string().email('Invalid email address'),
  customer_phone: z.string().min(1, 'Phone number is required'),
  delivery_address: z.string().min(1, 'Delivery address is required'),
  delivery_area: z.enum(['inside_dhaka', 'outside_dhaka'], {
    message: 'Please select a delivery area',
  }),
  apply_reseller_price: z.boolean().optional(),
});

export type OrderFormData = z.infer<typeof orderSchema>;
