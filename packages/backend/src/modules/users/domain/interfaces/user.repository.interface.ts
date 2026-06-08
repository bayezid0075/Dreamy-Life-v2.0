import { User, UserProps } from '../entities/user.entity';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(props: UserProps): Promise<User>;
  update(id: string, props: Partial<UserProps>): Promise<User>;
  delete(id: string): Promise<void>;
}
