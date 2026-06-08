import { Injectable, Inject } from '@nestjs/common';
import { IUserRepository } from '../../domain/interfaces/user.repository.interface';
import { User, UserProps } from '../../domain/entities/user.entity';
import { users } from '../../../infrastructure/database/schema';
import { NodePGDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @Inject('DATABASE_CONNECTION') private readonly db: NodePGDatabase<any>
  ) {}

  async findById(id: string): Promise<User | null> {
    const result = await this.db.query.users.findFirst({
      where: eq(users.id, id),
    });
    return result || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.db.query.users.findFirst({
      where: eq(users.email, email),
    });
    return result || null;
  }

  async create(props: UserProps): Promise<User> {
    const [newUser] = await this.db.insert(users).values({
      email: props.email,
      password: props.passwordHash,
      fullName: props.fullName,
      isVerified: props.isVerified ?? false,
      verificationCode: props.verificationCode,
    }).returning();
    return newUser as User;
  }

  async update(id: string, props: Partial<UserProps>): Promise<User> {
    const [updatedUser] = await this.db.update(users)
      .set({ ...props, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser as User;
  }

  async delete(id: string): Promise<void> {
    await this.db.update(users)
      .set({ deletedAt: new Date() })
      .where(eq(users.id, id));
  }
}
