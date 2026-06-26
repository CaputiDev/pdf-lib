import { describe, it, expect, vi } from 'vitest';
import { LoginUseCase } from './LoginUseCase';
import type { IAuthRepository, LoginResult } from '@core/ports/IAuthRepository';

function makeFakeAuthRepo(overrides: Partial<IAuthRepository> = {}): IAuthRepository {
  return {
    register: vi.fn(),
    login: vi.fn(),
    ...overrides,
  };
}

describe('LoginUseCase', () => {
  it('should call authRepository.login and return the result', async () => {
    const expectedResult: LoginResult = {
      token: 'jwt-token-123',
      user: { id: 'u1', email: 'test@email.com', name: 'Test User' },
      expiresAt: Date.now() + 86400000,
    };

    const repo = makeFakeAuthRepo({
      login: vi.fn().mockResolvedValue(expectedResult),
    });

    const useCase = new LoginUseCase(repo);
    const result = await useCase.execute({ email: 'test@email.com', password: 'pass123' });

    expect(repo.login).toHaveBeenCalledOnce();
    expect(repo.login).toHaveBeenCalledWith({ email: 'test@email.com', password: 'pass123' });
    expect(result).toEqual(expectedResult);
  });

  it('should propagate errors from the repository', async () => {
    const repo = makeFakeAuthRepo({
      login: vi.fn().mockRejectedValue(new Error('Invalid credentials')),
    });

    const useCase = new LoginUseCase(repo);

    await expect(useCase.execute({ email: 'bad@email.com', password: 'wrong' }))
      .rejects
      .toThrow('Invalid credentials');
  });
});
