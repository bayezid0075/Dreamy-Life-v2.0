import { Module } from '@nestjs/common';
import { UsersController } from './interfaces/controllers/users.controller';
import { UsersService } from './application/services/users.service';
import { UserRepository } from './infrastructure/repository/user.repository';

@Module({
  controllers: [UsersController],
  providers: [UsersService, UserRepository],
  exports: [UsersService],
})
export class UsersModule {}
