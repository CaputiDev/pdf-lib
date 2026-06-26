import { describe, it, expect, vi } from 'vitest';
import { DeleteDocumentUseCase } from './DeleteDocumentUseCase';
import type { IDocumentRepository } from '@core/ports/IDocumentRepository';

function makeFakeDocRepo(overrides: Partial<IDocumentRepository> = {}): IDocumentRepository {
  return {
    list: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    stream: vi.fn(),
    ...overrides,
  };
}

describe('DeleteDocumentUseCase', () => {
  it('should call documentRepository.delete with the correct id', async () => {
    const repo = makeFakeDocRepo({
      delete: vi.fn().mockResolvedValue(undefined),
    });

    const useCase = new DeleteDocumentUseCase(repo);
    await useCase.execute('d1');

    expect(repo.delete).toHaveBeenCalledOnce();
    expect(repo.delete).toHaveBeenCalledWith('d1');
  });

  it('should propagate errors from the repository', async () => {
    const repo = makeFakeDocRepo({
      delete: vi.fn().mockRejectedValue(new Error('Not found')),
    });

    const useCase = new DeleteDocumentUseCase(repo);

    await expect(useCase.execute('invalid-id')).rejects.toThrow('Not found');
  });
});
