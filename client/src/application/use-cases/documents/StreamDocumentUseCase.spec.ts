import { describe, it, expect, vi } from 'vitest';
import { StreamDocumentUseCase } from './StreamDocumentUseCase';
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

describe('StreamDocumentUseCase', () => {
  it('should call documentRepository.stream and return the object URL', async () => {
    const objectUrl = 'blob:http://localhost:5173/abc-123';

    const repo = makeFakeDocRepo({
      stream: vi.fn().mockResolvedValue(objectUrl),
    });

    const useCase = new StreamDocumentUseCase(repo);
    const result = await useCase.execute('d1');

    expect(repo.stream).toHaveBeenCalledOnce();
    expect(repo.stream).toHaveBeenCalledWith('d1');
    expect(result).toBe(objectUrl);
  });

  it('should propagate errors from the repository', async () => {
    const repo = makeFakeDocRepo({
      stream: vi.fn().mockRejectedValue(new Error('Forbidden')),
    });

    const useCase = new StreamDocumentUseCase(repo);

    await expect(useCase.execute('private-doc')).rejects.toThrow('Forbidden');
  });
});
