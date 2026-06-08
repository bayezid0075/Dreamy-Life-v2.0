import { Injectable, NotFoundException } from '@nestjs/common';
import { IUserRepository } from '../../domain/interfaces/user.repository.interface';
import { User, UserProps } from '../../domain/entities/user.entity';
import { UserRepository } from '../../infrastructure/repository/user.repository';

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UserRepository) {}

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async create(props: UserProps): Promise<User> {
    return this.userRepository.create(props);
  }

  async updateProfile(id: string, props: Partial<UserProps>): Promise<User> {
    return this.userRepository.update(id, props);
  }
}
