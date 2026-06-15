import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive } from 'class-validator';

export class AddFundsDto {
  @ApiProperty({
    description: 'Amount to add to funds balance',
    example: 100,
  })
  @IsNumber()
  @IsPositive()
  amount: number;
}
