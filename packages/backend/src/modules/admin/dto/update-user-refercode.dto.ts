import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, Length } from 'class-validator';

export class UpdateUserRefercodeDto {
  @ApiProperty({
    description: 'New 8-digit referral code',
    example: '12345678',
  })
  @IsString()
  @Length(8, 8)
  @Matches(/^\d{8}$/, { message: 'Referral code must be exactly 8 digits' })
  refercode: string;
}
