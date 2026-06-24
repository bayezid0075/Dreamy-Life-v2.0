import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsString, IsNotEmpty } from 'class-validator';

export class PurchaseMembershipDto {
  @ApiProperty({
    description: 'ID of the membership plan to purchase',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  planId: string;
}

export class PaymentCallbackDto {
  @ApiProperty({
    description: 'Invoice ID from UddoktaPay',
    example: 'Erm9wzjM0FBwjSYT0QVb',
  })
  @IsString()
  @IsNotEmpty()
  invoice_id: string;
}
