import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateVendorDto {
  @ApiProperty({ description: 'Shop name', example: 'Premium Store' })
  @IsString()
  @IsNotEmpty()
  shopName: string;

  @ApiProperty({ description: 'Shop address', example: 'Dhaka, Bangladesh' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiPropertyOptional({ description: 'Banner image URL' })
  @IsOptional()
  @IsString()
  bannerUrl?: string;
}

export class UpdateVendorBannerDto {
  @ApiProperty({ description: 'Banner image URL' })
  @IsString()
  @IsNotEmpty()
  bannerUrl: string;
}

export class VerifyPaymentDto {
  @ApiProperty({ description: 'Invoice ID from UddoktaPay', example: 'abc123xyz' })
  @IsString()
  @IsNotEmpty()
  invoiceId: string;
}
