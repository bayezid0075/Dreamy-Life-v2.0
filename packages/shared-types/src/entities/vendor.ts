export interface Vendor {
  id: string;
  userId: string;
  shopName: string;
  address: string;
  bannerUrl?: string;
  paymentStatus: boolean;
  isActive: boolean;
  status: 'active' | 'banned';
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubCategory {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  vendorId: string;
  name: string;
  description?: string;
  category: string;
  actualPrice: number;
  discountPrice?: number;
  stock: number;
  sku: string;
  imageUrls: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type ResellerOrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentMethod = 'bkash' | 'nagad' | 'rocket' | 'cash_on_delivery';
export type ShipmentStatus = 'pending' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'returned';

export interface ResellerOrder {
  id: string;
  resellerId: string;
  vendorId: string;
  productId: string;
  customerName: string;
  customerPhone: string;
  customerAltPhone?: string;
  resellerPrice: number;
  vendorPrice: number;
  profit: number;
  customerAddress: string;
  paymentMethod: string;
  status: ResellerOrderStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Shipment {
  id: string;
  orderId: string;
  vendorId: string;
  trackingNumber?: string;
  carrier: string;
  status: ShipmentStatus;
  estimatedDelivery?: Date;
  deliveredAt?: Date;
  shippingAddress: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VendorPayment {
  id: string;
  userId: string;
  invoiceId: string;
  amount: number;
  fee: number;
  chargedAmount: number;
  paymentMethod?: string;
  senderNumber?: string;
  transactionId?: string;
  metadata?: Record<string, unknown>;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VendorWithStats extends Vendor {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
}

export interface ProductWithVendor extends Product {
  vendor: Vendor;
}

export interface ResellerOrderWithDetails extends ResellerOrder {
  product: Product;
  vendor: Vendor;
  shipment?: Shipment;
}
