import { IUserRepository } from '../../../users/core/interfaces/user.repository.interface';
import { UserEntity } from '../../../users/core/entities/user.entity';
import { UserAlreadyExistsException } from '../../../users/core/exceptions/user.exceptions';
import * as bcrypt from 'bcrypt';

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export class RegisterUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: RegisterInput): Promise<UserEntity> {
    const existing = await this.userRepository.findByEmail(input.email);
    if (existing) {
      throw new UserAlreadyExistsException(input.email);
    }

    const hashedPassword = await bcrypt.hash(input.password, 10);
    const user = UserEntity.create({
      email: input.email,
      password: hashedPassword,
      name: input.name,
    });

    return await this.userRepository.create(user);
  }
}
