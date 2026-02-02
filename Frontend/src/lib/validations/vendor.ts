import { z } from 'zod';

export const vendorSchema = z.object({
  shop_name: z.string().min(1, 'Shop name is required'),
  address: z.string().min(1, 'Address is required'),
});

export const productSchema = z.object({
  title: z.string().min(1, 'Product title is required'),
  description: z.string().min(1, 'Description is required'),
  sku: z.string().min(1, 'SKU is required'),
  category: z.string().min(1, 'Category is required'),
  brand: z.string().optional(),
  price: z.string().min(1, 'Price is required'),
  discount_price: z.string().optional(),
  reseller_mrp_price: z.string().optional(),
  delivery_charge_inside_dhaka: z.string().optional(),
  delivery_charge_outside_dhaka: z.string().optional(),
  vat: z.string().optional(),
  tags: z.string().optional(),
});

export type VendorFormData = z.infer<typeof vendorSchema>;
export type ProductFormData = z.infer<typeof productSchema>;
