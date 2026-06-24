import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsOptional, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

class PlanFeatureDto {
  @ApiProperty({ example: 'Priority Support' })
  @IsString()
  text: string;

  @ApiProperty({ example: 'headset_mic' })
  @IsString()
  icon: string;
}

export class CreateMembershipPlanDto {
  @ApiProperty({ example: 'basic' })
  @IsString()
  name: string;

  @ApiProperty({ example: '500' })
  @IsString()
  price: string;

  @ApiPropertyOptional({ example: 'Basic membership with starter benefits' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(0)
  level: number;

  @ApiPropertyOptional({ type: [PlanFeatureDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlanFeatureDto)
  features?: PlanFeatureDto[];

  @ApiPropertyOptional({ example: 'Choose Basic' })
  @IsOptional()
  @IsString()
  buttonText?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isPopular?: boolean;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @ApiPropertyOptional({ example: 'primary' })
  @IsOptional()
  @IsString()
  colorTheme?: string;

  @ApiPropertyOptional({ example: [10, 5, 3, 2, 1, 0.5, 0.5, 0.5, 0.5, 0.5], description: 'Commission percentages for 10 upline levels' })
  @IsOptional()
  @IsArray()
  commissionRates?: number[];

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateMembershipPlanDto {
  @ApiPropertyOptional({ example: 'basic' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '500' })
  @IsOptional()
  @IsString()
  price?: string;

  @ApiPropertyOptional({ example: 'Basic membership with starter benefits' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  level?: number;

  @ApiPropertyOptional({ type: [PlanFeatureDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlanFeatureDto)
  features?: PlanFeatureDto[];

  @ApiPropertyOptional({ example: 'Choose Basic' })
  @IsOptional()
  @IsString()
  buttonText?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isPopular?: boolean;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @ApiPropertyOptional({ example: 'primary' })
  @IsOptional()
  @IsString()
  colorTheme?: string;

  @ApiPropertyOptional({ example: [10, 5, 3, 2, 1, 0.5, 0.5, 0.5, 0.5, 0.5], description: 'Commission percentages for 10 upline levels' })
  @IsOptional()
  @IsArray()
  commissionRates?: number[];

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
