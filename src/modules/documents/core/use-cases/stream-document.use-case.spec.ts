import { Readable } from 'stream';
import { StreamDocumentUseCase } from './stream-document.use-case';
import { IDocumentRepository } from '../interfaces/document.repository.interface';
import { IStorageAdapter } from '../interfaces/storage.interface';
import { DocumentEntity } from '../entities/document.entity';
import { DocumentNotFoundException } from '../exceptions/document.exceptions';

describe('StreamDocumentUseCase', () => {
  let useCase: StreamDocumentUseCase;
  let mockRepository: jest.Mocked<IDocumentRepository>;
  let mockStorage: jest.Mocked<IStorageAdapter>;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
    } as any;

    mockStorage = {
      save: jest.fn(),
      delete: jest.fn(),
      getStream: jest.fn(),
    } as any;

    useCase = new StreamDocumentUseCase(mockRepository, mockStorage);
  });

  const mockDoc = DocumentEntity.create({
    id: 'doc-uuid',
    title: 'Test PDF',
    sizeBytes: 500,
    filePath: 'uploads/test.pdf',
    userId: 'owner-uuid',
  });

  it('deve retornar a stream e os metadados do documento', async () => {
    const mockStream = new Readable();
    mockRepository.findById.mockResolvedValue(mockDoc);
    mockStorage.getStream.mockResolvedValue(mockStream);

    const result = await useCase.execute('doc-uuid');

    expect(mockRepository.findById).toHaveBeenCalledWith('doc-uuid');
    expect(mockStorage.getStream).toHaveBeenCalledWith('uploads/test.pdf');
    expect(result.stream).toBe(mockStream);
    expect(result.document).toBe(mockDoc);
  });

  it('deve lançar DocumentNotFoundException se o documento não existir', async () => {
    mockRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('doc-uuid')).rejects.toThrow(
      DocumentNotFoundException,
    );
    expect(mockStorage.getStream).not.toHaveBeenCalled();
  });
});
