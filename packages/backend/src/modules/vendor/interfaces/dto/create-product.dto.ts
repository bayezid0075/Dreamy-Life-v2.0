import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, Min, IsObject } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ description: 'Product name', example: 'Luna Glo Lamp' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Product description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Product category', example: 'lighting' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiPropertyOptional({ description: 'Product subcategory', example: 'table_lamp' })
  @IsOptional()
  @IsString()
  subcategory?: string;

  @ApiProperty({ description: 'Actual/original price', example: 150.00 })
  @IsNumber()
  @Min(0)
  actualPrice: number;

  @ApiPropertyOptional({ description: 'Discount/sale price', example: 120.00 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountPrice?: number;

  @ApiPropertyOptional({ description: 'Delivery charge inside Dhaka', example: 60 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  deliveryChargeInside?: number;

  @ApiPropertyOptional({ description: 'Delivery charge outside Dhaka', example: 120 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  deliveryChargeOutside?: number;

  @ApiPropertyOptional({ description: 'Available colors', type: [String], example: ['Red', 'Blue', 'Green'] })
  @IsOptional()
  @IsArray()
  colors?: string[];

  @ApiPropertyOptional({ description: 'Available sizes', type: [String], example: ['S', 'M', 'L', 'XL'] })
  @IsOptional()
  @IsArray()
  sizes?: string[];

  @ApiPropertyOptional({ description: 'Variant prices by color/size', example: { 'Red-L': { price: 500 }, 'Blue-M': { price: 450 } } })
  @IsOptional()
  @IsObject()
  variantPrices?: Record<string, { price: number }>;

  @ApiProperty({ description: 'Stock quantity', example: 50 })
  @IsNumber()
  @Min(0)
  stock: number;

  @ApiPropertyOptional({ description: 'Custom SKU (auto-generated if not provided)' })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({ description: 'Product image URLs', type: [String] })
  @IsOptional()
  @IsArray()
  imageUrls?: string[];
}

export class UpdateProductDto {
  @ApiPropertyOptional({ description: 'Product name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Product description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Product category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Product subcategory' })
  @IsOptional()
  @IsString()
  subcategory?: string;

  @ApiPropertyOptional({ description: 'Actual/original price' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  actualPrice?: number;

  @ApiPropertyOptional({ description: 'Discount/sale price' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountPrice?: number;

  @ApiPropertyOptional({ description: 'Delivery charge inside Dhaka' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  deliveryChargeInside?: number;

  @ApiPropertyOptional({ description: 'Delivery charge outside Dhaka' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  deliveryChargeOutside?: number;

  @ApiPropertyOptional({ description: 'Available colors', type: [String] })
  @IsOptional()
  @IsArray()
  colors?: string[];

  @ApiPropertyOptional({ description: 'Available sizes', type: [String] })
  @IsOptional()
  @IsArray()
  sizes?: string[];

  @ApiPropertyOptional({ description: 'Variant prices by color/size' })
  @IsOptional()
  @IsObject()
  variantPrices?: Record<string, { price: number }>;

  @ApiPropertyOptional({ description: 'Stock quantity' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional({ description: 'Product image URLs', type: [String] })
  @IsOptional()
  @IsArray()
  imageUrls?: string[];
}
