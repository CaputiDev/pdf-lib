/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/unbound-method, @typescript-eslint/require-await */
import {
  CreateDocumentUseCase,
  CreateDocumentInput,
} from './create-document.use-case';
import { decryptWithKey } from '../../../../common/utils/crypto.utils';
import { IDocumentRepository } from '../interfaces/document.repository.interface';
import { IStorageAdapter } from '../interfaces/storage.interface';
import { DocumentEntity } from '../entities/document.entity';
import { InvalidDocumentException } from '../exceptions/document.exceptions';

describe('CreateDocumentUseCase', () => {
  let useCase: CreateDocumentUseCase;
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
    };

    useCase = new CreateDocumentUseCase(mockRepository, mockStorage);
  });

  const validProps: CreateDocumentInput = {
    title: 'Test PDF Document',
    author: 'John Doe',
    fileName: 'test-file.pdf',
    fileBuffer: Buffer.from('PDF_CONTENT'),
    sizeBytes: 1024,
    userId: 'user-uuid',
    tags: ['PDF', 'Test'],
  };

  it('deve criar um documento com sucesso', async () => {
    mockStorage.save.mockResolvedValue('uploads/test-file.pdf');
    mockRepository.create.mockImplementation(async (doc) => doc);

    const result = await useCase.execute(validProps);

    expect(mockStorage.save).toHaveBeenCalledWith(
      'test-file.pdf',
      validProps.fileBuffer,
    );
    expect(mockRepository.create).toHaveBeenCalled();
    expect(result).toBeInstanceOf(DocumentEntity);
    expect(result.title).toBe('Test PDF Document');
    expect(result.filePath).toBe('uploads/test-file.pdf');
    expect(result.tags).toHaveLength(2);
    expect(result.tags[0].name).toBe('pdf'); // normalizado para minúsculo
    expect(result.tags[1].name).toBe('test');
  });

  it('deve criar um documento sem tags com sucesso', async () => {
    mockStorage.save.mockResolvedValue('uploads/test-file.pdf');
    mockRepository.create.mockImplementation(async (doc) => doc);

    const result = await useCase.execute({ ...validProps, tags: undefined });

    expect(mockStorage.save).toHaveBeenCalledWith(
      'test-file.pdf',
      validProps.fileBuffer,
    );
    expect(mockRepository.create).toHaveBeenCalled();
    expect(result).toBeInstanceOf(DocumentEntity);
    expect(result.tags).toHaveLength(0);
  });

  it('deve criar um documento privado criptografando o arquivo e salvando a chave no banco', async () => {
    mockStorage.save.mockResolvedValue('uploads/test-file-private.pdf');
    mockRepository.create.mockImplementation(async (doc) => doc);

    const result = await useCase.execute({
      ...validProps,
      isPrivate: true,
    });

    expect(mockStorage.save).toHaveBeenCalled();
    expect(result.isPrivate).toBe(true);
    expect(result.encryptionKey).toHaveLength(64);

    const saveCallBuffer = mockStorage.save.mock.calls[0][1];
    expect(saveCallBuffer).not.toEqual(validProps.fileBuffer);

    const decrypted = decryptWithKey(saveCallBuffer, result.encryptionKey);
    expect(decrypted).toEqual(validProps.fileBuffer);
  });

  it('deve lançar InvalidDocumentException se o buffer de arquivo estiver vazio', async () => {
    const invalidProps = { ...validProps, fileBuffer: Buffer.alloc(0) };

    await expect(useCase.execute(invalidProps)).rejects.toThrow(
      InvalidDocumentException,
    );
    expect(mockStorage.save).not.toHaveBeenCalled();
  });

  it('deve lançar InvalidDocumentException se o título for vazio', async () => {
    const invalidProps = { ...validProps, title: '' };

    await expect(useCase.execute(invalidProps)).rejects.toThrow(
      InvalidDocumentException,
    );
  });

  it('deve lançar InvalidDocumentException se o tamanho do arquivo for menor ou igual a zero', async () => {
    const invalidProps = { ...validProps, sizeBytes: 0 };

    await expect(useCase.execute(invalidProps)).rejects.toThrow(
      InvalidDocumentException,
    );
  });
});
