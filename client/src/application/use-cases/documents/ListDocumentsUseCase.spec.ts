import { describe, it, expect, vi } from 'vitest';
import { ListDocumentsUseCase } from './ListDocumentsUseCase';
import type { IDocumentRepository } from '@core/ports/IDocumentRepository';
import type { PaginatedDocuments } from '@core/domain/value-objects/PaginationMeta';

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

describe('ListDocumentsUseCase', () => {
  it('should call documentRepository.list with the given filter and return paginated results', async () => {
    const expectedResult: PaginatedDocuments = {
      documents: [
        {
          id: 'd1',
          title: 'Test PDF',
          author: 'Author',
          sizeBytes: 1024,
          filePath: 'uploads/test.pdf',
          uploadedAt: '2026-06-20T00:00:00.000Z',
          isPrivate: false,
          userId: 'u1',
          tags: ['test'],
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
      pages: 1,
    };

    const repo = makeFakeDocRepo({
      list: vi.fn().mockResolvedValue(expectedResult),
    });

    const useCase = new ListDocumentsUseCase(repo);
    const filter = { search: 'test', page: 1, limit: 10 };
    const result = await useCase.execute(filter);

    expect(repo.list).toHaveBeenCalledOnce();
    expect(repo.list).toHaveBeenCalledWith(filter);
    expect(result).toEqual(expectedResult);
  });

  it('should pass empty filter without errors', async () => {
    const emptyResult: PaginatedDocuments = {
      documents: [],
      total: 0,
      page: 1,
      limit: 10,
      pages: 0,
    };

    const repo = makeFakeDocRepo({
      list: vi.fn().mockResolvedValue(emptyResult),
    });

    const useCase = new ListDocumentsUseCase(repo);
    const result = await useCase.execute({});

    expect(repo.list).toHaveBeenCalledWith({});
    expect(result.documents).toHaveLength(0);
  });

  it('should propagate errors from the repository', async () => {
    const repo = makeFakeDocRepo({
      list: vi.fn().mockRejectedValue(new Error('Network error')),
    });

    const useCase = new ListDocumentsUseCase(repo);

    await expect(useCase.execute({})).rejects.toThrow('Network error');
  });
});
