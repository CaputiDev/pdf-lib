import { describe, it, expect, vi } from 'vitest';
import { UpdateDocumentUseCase } from './UpdateDocumentUseCase';
import type { IDocumentRepository } from '@core/ports/IDocumentRepository';
import type { Document } from '@core/domain/entities/Document';

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

describe('UpdateDocumentUseCase', () => {
  it('should call documentRepository.update with id and input, then return the updated document', async () => {
    const updatedDoc: Document = {
      id: 'd1',
      title: 'Updated Title',
      author: 'New Author',
      sizeBytes: 1024,
      filePath: 'uploads/test.pdf',
      uploadedAt: '2026-06-20T00:00:00.000Z',
      isPrivate: false,
      userId: 'u1',
      tags: ['updated'],
    };

    const repo = makeFakeDocRepo({
      update: vi.fn().mockResolvedValue(updatedDoc),
    });

    const useCase = new UpdateDocumentUseCase(repo);
    const result = await useCase.execute('d1', { title: 'Updated Title', author: 'New Author', tags: ['updated'] });

    expect(repo.update).toHaveBeenCalledOnce();
    expect(repo.update).toHaveBeenCalledWith('d1', {
      title: 'Updated Title',
      author: 'New Author',
      tags: ['updated'],
    });
    expect(result).toEqual(updatedDoc);
  });

  it('should support partial updates (only title)', async () => {
    const updatedDoc: Document = {
      id: 'd1',
      title: 'New Title',
      author: 'Existing Author',
      sizeBytes: 1024,
      filePath: 'uploads/test.pdf',
      uploadedAt: '2026-06-20T00:00:00.000Z',
      isPrivate: false,
      userId: 'u1',
      tags: [],
    };

    const repo = makeFakeDocRepo({
      update: vi.fn().mockResolvedValue(updatedDoc),
    });

    const useCase = new UpdateDocumentUseCase(repo);
    const result = await useCase.execute('d1', { title: 'New Title' });

    expect(repo.update).toHaveBeenCalledWith('d1', { title: 'New Title' });
    expect(result.title).toBe('New Title');
  });

  it('should propagate errors from the repository', async () => {
    const repo = makeFakeDocRepo({
      update: vi.fn().mockRejectedValue(new Error('Forbidden')),
    });

    const useCase = new UpdateDocumentUseCase(repo);

    await expect(useCase.execute('d1', { title: 'New' })).rejects.toThrow('Forbidden');
  });
});
