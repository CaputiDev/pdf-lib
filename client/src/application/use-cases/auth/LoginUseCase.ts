import type { IAuthRepository, LoginInput, LoginResult } from '@core/ports/IAuthRepository';

/**
 * Authenticates a user and returns the token + user data.
 *
 * Pure TS class — no framework dependencies.
 */
export class LoginUseCase {
  private readonly authRepository: IAuthRepository;

  constructor(authRepository: IAuthRepository) {
    this.authRepository = authRepository;
  }

  async execute(input: LoginInput): Promise<LoginResult> {
    return this.authRepository.login(input);
  }
}
