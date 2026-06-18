import { DeleteDocumentUseCase } from './delete-document.use-case';
import { IDocumentRepository } from '../interfaces/document.repository.interface';
import { IStorageAdapter } from '../interfaces/storage.interface';
import { DocumentEntity } from '../entities/document.entity';
import {
  DocumentNotFoundException,
  UnauthorizedDocumentException,
} from '../exceptions/document.exceptions';

describe('DeleteDocumentUseCase', () => {
  let useCase: DeleteDocumentUseCase;
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

    useCase = new DeleteDocumentUseCase(mockRepository, mockStorage);
  });

  const mockDoc = DocumentEntity.create({
    id: 'doc-uuid',
    title: 'Test PDF',
    sizeBytes: 500,
    filePath: 'uploads/test.pdf',
    userId: 'owner-uuid',
  });

  it('deve deletar um documento com sucesso se o usuário for o dono', async () => {
    mockRepository.findById.mockResolvedValue(mockDoc);
    mockStorage.delete.mockResolvedValue(undefined);
    mockRepository.delete.mockResolvedValue(undefined);

    await useCase.execute({ id: 'doc-uuid', userId: 'owner-uuid' });

    expect(mockRepository.findById).toHaveBeenCalledWith('doc-uuid');
    expect(mockStorage.delete).toHaveBeenCalledWith('uploads/test.pdf');
    expect(mockRepository.delete).toHaveBeenCalledWith('doc-uuid');
  });

  it('deve lançar DocumentNotFoundException se o documento não existir', async () => {
    mockRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ id: 'doc-uuid', userId: 'owner-uuid' }),
    ).rejects.toThrow(DocumentNotFoundException);

    expect(mockStorage.delete).not.toHaveBeenCalled();
    expect(mockRepository.delete).not.toHaveBeenCalled();
  });

  it('deve lançar UnauthorizedDocumentException se o usuário não for o dono', async () => {
    mockRepository.findById.mockResolvedValue(mockDoc);

    await expect(
      useCase.execute({ id: 'doc-uuid', userId: 'stranger-uuid' }),
    ).rejects.toThrow(UnauthorizedDocumentException);

    expect(mockStorage.delete).not.toHaveBeenCalled();
    expect(mockRepository.delete).not.toHaveBeenCalled();
  });
});
