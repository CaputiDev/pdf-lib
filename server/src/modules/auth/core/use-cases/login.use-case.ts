import { IUserRepository } from '../../../users/core/interfaces/user.repository.interface';
import { UserEntity } from '../../../users/core/entities/user.entity';
import { InvalidCredentialsException } from '../../../users/core/exceptions/user.exceptions';
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
      throw new InvalidCredentialsException();
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.password);
    if (!isPasswordValid) {
      throw new InvalidCredentialsException();
    }

    return user;
  }
}
