import type { IAuthRepository, RegisterInput } from '@core/ports/IAuthRepository';

/**
 * Registers a new user account.
 *
 * Pure TS class — no framework dependencies.
 */
export class RegisterUseCase {
  private readonly authRepository: IAuthRepository;

  constructor(authRepository: IAuthRepository) {
    this.authRepository = authRepository;
  }

  async execute(input: RegisterInput): Promise<void> {
    return this.authRepository.register(input);
  }
}
