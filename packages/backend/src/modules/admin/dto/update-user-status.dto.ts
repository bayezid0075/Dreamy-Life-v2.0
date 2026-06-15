import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsIn } from 'class-validator';

export class UpdateUserStatusDto {
  @ApiProperty({
    description: 'New member status',
    enum: ['user', 'basic', 'standard', 'smart', 'vvip', 'super_admin'],
    example: 'basic',
  })
  @IsString()
  @IsIn(['user', 'basic', 'standard', 'smart', 'vvip', 'super_admin'])
  memberStatus: string;
}
