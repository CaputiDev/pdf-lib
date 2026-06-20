import type { User } from '../domain/entities/User';

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResult {
  token: string;
  user: User;
  expiresAt: number;
}

export interface IAuthRepository {
  register(input: RegisterInput): Promise<void>;
  login(input: LoginInput): Promise<LoginResult>;
}
