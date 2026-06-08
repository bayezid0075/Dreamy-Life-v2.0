import { Controller, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { UsersService } from '../../application/services/users.service';
import { UserProps } from '../../domain/entities/user.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  async getProfile(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch('profile')
  async updateProfile(@Body() props: Partial<UserProps>) {
    // Note: User ID should be retrieved from the JWT in a real implementation
    return this.usersService.updateProfile('user-id-from-jwt', props);
  }
}
