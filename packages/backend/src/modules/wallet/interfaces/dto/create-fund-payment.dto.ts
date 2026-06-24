import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, IsString, IsNotEmpty } from 'class-validator';

export class CreateFundPaymentDto {
  @ApiProperty({ description: 'Amount to add to funds', example: 100 })
  @IsNumber()
  @IsPositive()
  amount: number;
}

export class PaymentCallbackDto {
  @ApiProperty({ description: 'Invoice ID from UddoktaPay', example: 'abc123xyz' })
  @IsString()
  @IsNotEmpty()
  invoice_id: string;
}
