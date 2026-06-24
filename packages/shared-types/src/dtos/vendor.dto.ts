export interface CreateVendorDto {
  shopName: string;
  address: string;
  bannerUrl?: string;
}

export interface UpdateVendorBannerDto {
  bannerUrl: string;
}

export interface CreateProductDto {
  name: string;
  description?: string;
  category: string;
  price: number;
  stock: number;
  sku?: string;
  imageUrls?: string[];
}

export interface UpdateProductDto {
  name?: string;
  description?: string;
  category?: string;
  price?: number;
  stock?: number;
  imageUrls?: string[];
}

export interface CreateResellerOrderDto {
  productId: string;
  customerName: string;
  customerPhone: string;
  customerAltPhone?: string;
  resellerPrice: number;
  customerAddress: string;
  paymentMethod: string;
}

export interface UpdateOrderStatusDto {
  status: string;
}

export interface CreateShipmentDto {
  orderId: string;
  trackingNumber?: string;
  carrier?: string;
  shippingAddress: string;
  estimatedDelivery?: string;
  notes?: string;
}

export interface UpdateShipmentDto {
  status?: string;
  trackingNumber?: string;
  carrier?: string;
  notes?: string;
}

export interface VendorApplyResponse {
  paymentUrl?: string;
  vendor?: {
    id: string;
    shopName: string;
    isActive: boolean;
  };
  message: string;
}

export interface ProductFeedQuery {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ResellerOrderResponse {
  id: string;
  customerName: string;
  status: string;
  profit: number;
  createdAt: Date;
}

export interface OrderTrackingResponse {
  order: {
    id: string;
    status: string;
    customerName: string;
    customerAddress: string;
  };
  shipment?: {
    id: string;
    trackingNumber?: string;
    carrier: string;
    status: string;
    estimatedDelivery?: Date;
    deliveredAt?: Date;
    shippingAddress: string;
    notes?: string;
  };
  timeline: Array<{
    status: string;
    timestamp: Date;
    description: string;
  }>;
}
