import { IUserRepository } from '../../../users/core/interfaces/user.repository.interface';
import { UserEntity } from '../../../users/core/entities/user.entity';
import * as bcrypt from 'bcrypt';

export interface LoginInput {
  email: string;
  password: string;
}

export class LoginUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: LoginInput): Promise<UserEntity> {
    const user = await this.userRepository.findByEmail(input.email);
    if (!user) {
      throw new Error('E-mail ou senha inválidos.');
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.password);
    if (!isPasswordValid) {
      throw new Error('E-mail ou senha inválidos.');
    }

    return user;
  }
}
