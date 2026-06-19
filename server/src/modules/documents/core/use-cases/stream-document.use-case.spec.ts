/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/unbound-method */
import { Readable } from 'stream';
import { StreamDocumentUseCase } from './stream-document.use-case';
import { IDocumentRepository } from '../interfaces/document.repository.interface';
import { IStorageAdapter } from '../interfaces/storage.interface';
import { DocumentEntity } from '../entities/document.entity';
import {
  DocumentNotFoundException,
  UnauthorizedDocumentException,
} from '../exceptions/document.exceptions';
import {
  generateRandomKeyHex,
  encryptWithKey,
} from '../../../../common/utils/crypto.utils';

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
    };

    useCase = new StreamDocumentUseCase(mockRepository, mockStorage);
  });

  const mockDoc = DocumentEntity.create({
    id: 'doc-uuid',
    title: 'Test PDF',
    sizeBytes: 500,
    filePath: 'uploads/test.pdf',
    userId: 'owner-uuid',
    isPrivate: false,
  });

  it('deve retornar a stream e os metadados do documento público', async () => {
    const mockStream = Readable.from([Buffer.from('PDF_CONTENT')]);
    mockRepository.findById.mockResolvedValue(mockDoc);
    mockStorage.getStream.mockResolvedValue(mockStream);

    const result = await useCase.execute({ id: 'doc-uuid' });

    expect(mockRepository.findById).toHaveBeenCalledWith('doc-uuid');
    expect(mockStorage.getStream).toHaveBeenCalledWith('uploads/test.pdf');
    expect(result.document).toBe(mockDoc);

    const chunks: Buffer[] = [];
    for await (const chunk of result.stream) {
      chunks.push(Buffer.from(chunk));
    }
    expect(Buffer.concat(chunks).toString()).toBe('PDF_CONTENT');
  });

  it('deve decodificar o arquivo e retornar a stream para o dono de um documento privado', async () => {
    const key = generateRandomKeyHex();
    const rawData = Buffer.from('Confidential report content');
    const encryptedData = encryptWithKey(rawData, key);

    const privateDoc = DocumentEntity.create({
      id: 'doc-uuid',
      title: 'Private PDF',
      sizeBytes: encryptedData.length,
      filePath: 'uploads/private.pdf',
      userId: 'owner-uuid',
      isPrivate: true,
      encryptionKey: key,
    });

    const mockStream = Readable.from([encryptedData]);
    mockRepository.findById.mockResolvedValue(privateDoc);
    mockStorage.getStream.mockResolvedValue(mockStream);

    const result = await useCase.execute({
      id: 'doc-uuid',
      currentUserId: 'owner-uuid',
    });

    expect(mockRepository.findById).toHaveBeenCalledWith('doc-uuid');
    expect(mockStorage.getStream).toHaveBeenCalledWith('uploads/private.pdf');
    expect(result.document).toBe(privateDoc);

    const chunks: Buffer[] = [];
    for await (const chunk of result.stream) {
      chunks.push(Buffer.from(chunk));
    }
    expect(Buffer.concat(chunks).toString()).toBe(
      'Confidential report content',
    );
  });

  it('deve lançar UnauthorizedDocumentException se um não-proprietário tentar ler um documento privado', async () => {
    const privateDoc = DocumentEntity.create({
      id: 'doc-uuid',
      title: 'Private PDF',
      sizeBytes: 500,
      filePath: 'uploads/private.pdf',
      userId: 'owner-uuid',
      isPrivate: true,
      encryptionKey: 'somekey',
    });

    mockRepository.findById.mockResolvedValue(privateDoc);

    await expect(
      useCase.execute({ id: 'doc-uuid', currentUserId: 'attacker-uuid' }),
    ).rejects.toThrow(UnauthorizedDocumentException);
    expect(mockStorage.getStream).not.toHaveBeenCalled();
  });

  it('deve lançar DocumentNotFoundException se o documento não existir', async () => {
    mockRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute({ id: 'doc-uuid' })).rejects.toThrow(
      DocumentNotFoundException,
    );
    expect(mockStorage.getStream).not.toHaveBeenCalled();
  });
});
