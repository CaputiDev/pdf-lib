import { describe, it, expect, vi } from 'vitest';
import { RegisterUseCase } from './RegisterUseCase';
import type { IAuthRepository } from '@core/ports/IAuthRepository';

function makeFakeAuthRepo(overrides: Partial<IAuthRepository> = {}): IAuthRepository {
  return {
    register: vi.fn(),
    login: vi.fn(),
    ...overrides,
  };
}

describe('RegisterUseCase', () => {
  it('should call authRepository.register with the correct input', async () => {
    const repo = makeFakeAuthRepo({
      register: vi.fn().mockResolvedValue(undefined),
    });

    const useCase = new RegisterUseCase(repo);
    const input = { name: 'Test User', email: 'test@email.com', password: 'pass123' };

    await useCase.execute(input);

    expect(repo.register).toHaveBeenCalledOnce();
    expect(repo.register).toHaveBeenCalledWith(input);
  });

  it('should propagate errors from the repository', async () => {
    const repo = makeFakeAuthRepo({
      register: vi.fn().mockRejectedValue(new Error('Email already exists')),
    });

    const useCase = new RegisterUseCase(repo);

    await expect(
      useCase.execute({ name: 'Test', email: 'dup@email.com', password: 'pass' }),
    ).rejects.toThrow('Email already exists');
  });
});
