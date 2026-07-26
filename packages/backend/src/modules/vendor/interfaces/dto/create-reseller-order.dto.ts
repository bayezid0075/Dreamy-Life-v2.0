import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, IsIn } from 'class-validator';

export class CreateResellerOrderDto {
  @ApiProperty({ description: 'Product ID to order', example: 'uuid-product-id' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ description: 'Customer name', example: 'Rahman Ahmed' })
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @ApiProperty({ description: 'Customer phone number', example: '01712345678' })
  @IsString()
  @IsNotEmpty()
  customerPhone: string;

  @ApiPropertyOptional({ description: 'Alternative phone number' })
  @IsOptional()
  @IsString()
  customerAltPhone?: string;

  @ApiProperty({ description: 'Reseller price (what customer pays)', example: 150.00 })
  @IsNumber()
  @Min(0)
  resellerPrice: number;

  @ApiProperty({ description: 'Customer delivery address', example: 'House 12, Road 5, Dhanmondi, Dhaka' })
  @IsString()
  @IsNotEmpty()
  customerAddress: string;

  @ApiProperty({ description: 'Payment method', enum: ['bkash', 'nagad', 'rocket', 'cash_on_delivery', 'funds'], example: 'bkash' })
  @IsString()
  @IsNotEmpty()
  @IsIn(['bkash', 'nagad', 'rocket', 'cash_on_delivery', 'funds'])
  paymentMethod: string;

  @ApiPropertyOptional({ description: 'Delivery method', enum: ['inside', 'outside'] })
  @IsOptional()
  @IsString()
  @IsIn(['inside', 'outside'])
  deliveryMethod?: string;

  @ApiPropertyOptional({ description: 'Delivery charge amount', example: 60 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  deliveryCharge?: number;
}

export class UpdateOrderStatusDto {
  @ApiProperty({ description: 'New order status', enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] })
  @IsString()
  @IsNotEmpty()
  @IsIn(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'])
  status: string;
}

export class CreateShipmentDto {
  @ApiProperty({ description: 'Order ID' })
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiPropertyOptional({ description: 'Tracking number' })
  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @ApiPropertyOptional({ description: 'Carrier name', example: 'self' })
  @IsOptional()
  @IsString()
  carrier?: string;

  @ApiProperty({ description: 'Shipping address' })
  @IsString()
  @IsNotEmpty()
  shippingAddress: string;

  @ApiPropertyOptional({ description: 'Estimated delivery date' })
  @IsOptional()
  @IsString()
  estimatedDelivery?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateShipmentDto {
  @ApiPropertyOptional({ description: 'New shipment status', enum: ['pending', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'returned'] })
  @IsOptional()
  @IsString()
  @IsIn(['pending', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'returned'])
  status?: string;

  @ApiPropertyOptional({ description: 'Tracking number' })
  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @ApiPropertyOptional({ description: 'Carrier name' })
  @IsOptional()
  @IsString()
  carrier?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
