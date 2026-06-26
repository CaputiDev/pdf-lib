import { describe, it, expect, vi } from 'vitest';
import { UploadDocumentUseCase } from './UploadDocumentUseCase';
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

describe('UploadDocumentUseCase', () => {
  it('should call documentRepository.create and return the new document', async () => {
    const createdDoc: Document = {
      id: 'd1',
      title: 'Uploaded PDF',
      author: 'Author',
      sizeBytes: 2048,
      filePath: 'uploads/uploaded.pdf',
      uploadedAt: '2026-06-20T00:00:00.000Z',
      isPrivate: false,
      userId: 'u1',
      tags: ['upload'],
    };

    const repo = makeFakeDocRepo({
      create: vi.fn().mockResolvedValue(createdDoc),
    });

    const useCase = new UploadDocumentUseCase(repo);
    const file = new File(['pdf content'], 'test.pdf', { type: 'application/pdf' });
    const input = { file, title: 'Uploaded PDF', author: 'Author', tags: ['upload'] };

    const result = await useCase.execute(input);

    expect(repo.create).toHaveBeenCalledOnce();
    expect(repo.create).toHaveBeenCalledWith(input);
    expect(result).toEqual(createdDoc);
  });

  it('should forward the onProgress callback', async () => {
    const createdDoc: Document = {
      id: 'd1',
      title: 'Test',
      author: null,
      sizeBytes: 1024,
      filePath: 'uploads/test.pdf',
      uploadedAt: '2026-06-20T00:00:00.000Z',
      isPrivate: false,
      userId: 'u1',
      tags: [],
    };

    const repo = makeFakeDocRepo({
      create: vi.fn().mockResolvedValue(createdDoc),
    });

    const onProgress = vi.fn();
    const useCase = new UploadDocumentUseCase(repo);
    const file = new File(['data'], 'test.pdf', { type: 'application/pdf' });

    await useCase.execute({ file, title: 'Test', onProgress });

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ onProgress }),
    );
  });

  it('should propagate errors from the repository', async () => {
    const repo = makeFakeDocRepo({
      create: vi.fn().mockRejectedValue(new Error('Upload failed')),
    });

    const useCase = new UploadDocumentUseCase(repo);
    const file = new File(['data'], 'test.pdf', { type: 'application/pdf' });

    await expect(useCase.execute({ file, title: 'Test' })).rejects.toThrow('Upload failed');
  });
});
