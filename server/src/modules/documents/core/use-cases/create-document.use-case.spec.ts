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

// ---------------------------------------------------------------------------
// Mock pdf-parse so tests never touch the filesystem or real PDF parsing.
// The default mock returns text that produces predictable keywords:
// "javascript" (x3), "typescript" (x2), "programming" (x1).
// ---------------------------------------------------------------------------
jest.mock('pdf-parse', () =>
  jest.fn().mockResolvedValue({
    text: 'javascript javascript javascript typescript typescript programming',
    numpages: 1,
    info: {},
    metadata: null,
    version: '1.4',
  }),
);

// Get a typed reference to the mocked function for per-test overrides
const pdfParseMock = jest.requireMock('pdf-parse') as jest.Mock;

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
    pdfParseMock.mockClear();
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

  // ----------------------------------------------------------------
  // Core creation behaviour
  // ----------------------------------------------------------------

  it('should create a document successfully with manual and auto-generated tags merged', async () => {
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

    // Manual tags (normalised): 'pdf', 'test'
    // Auto tags from mock pdf-parse: 'javascript', 'typescript', 'programming'
    const tagNames = result.tags.map((t) => t.name);
    expect(tagNames).toContain('pdf');
    expect(tagNames).toContain('test');
    expect(tagNames).toContain('javascript');
    expect(tagNames).toContain('typescript');
    expect(tagNames).toContain('programming');
  });

  it('should call pdf-parse with the raw (pre-encryption) file buffer', async () => {
    mockStorage.save.mockResolvedValue('uploads/test-file.pdf');
    mockRepository.create.mockImplementation(async (doc) => doc);

    await useCase.execute(validProps);

    expect(pdfParseMock).toHaveBeenCalledWith(validProps.fileBuffer);
  });

  it('should not produce duplicate tags when a manual tag matches an auto keyword', async () => {
    // "javascript" is both a manual tag and an auto keyword from pdf-parse mock
    pdfParseMock.mockResolvedValueOnce({
      text: 'javascript javascript javascript typescript',
    });
    mockStorage.save.mockResolvedValue('uploads/test-file.pdf');
    mockRepository.create.mockImplementation(async (doc) => doc);

    const result = await useCase.execute({
      ...validProps,
      tags: ['javascript', 'manual'],
    });

    const tagNames = result.tags.map((t) => t.name);
    const occurrences = tagNames.filter((n) => n === 'javascript').length;
    expect(occurrences).toBe(1);
  });

  it('should create a document without manual tags — using only auto-generated ones', async () => {
    mockStorage.save.mockResolvedValue('uploads/test-file.pdf');
    mockRepository.create.mockImplementation(async (doc) => doc);

    const result = await useCase.execute({ ...validProps, tags: undefined });

    expect(mockRepository.create).toHaveBeenCalled();
    expect(result).toBeInstanceOf(DocumentEntity);

    const tagNames = result.tags.map((t) => t.name);
    expect(tagNames).toContain('javascript');
    expect(tagNames).toContain('typescript');
    expect(tagNames).toContain('programming');
  });

  it('should produce zero tags when manual tags are empty and pdf-parse returns only stop words', async () => {
    pdfParseMock.mockResolvedValueOnce({
      text: 'the and for are but not',
    });
    mockStorage.save.mockResolvedValue('uploads/test-file.pdf');
    mockRepository.create.mockImplementation(async (doc) => doc);

    const result = await useCase.execute({ ...validProps, tags: [] });

    expect(result.tags).toHaveLength(0);
  });

  it('should gracefully continue without auto-tags if pdf-parse throws (corrupted file)', async () => {
    pdfParseMock.mockRejectedValueOnce(new Error('Corrupted PDF'));
    mockStorage.save.mockResolvedValue('uploads/test-file.pdf');
    mockRepository.create.mockImplementation(async (doc) => doc);

    const result = await useCase.execute({ ...validProps, tags: ['manual'] });

    // Only the manual tag should be present; no crash
    expect(result.tags).toHaveLength(1);
    expect(result.tags[0].name).toBe('manual');
  });

  // ----------------------------------------------------------------
  // Private document / encryption
  // ----------------------------------------------------------------

  it('should create a private document, encrypt the file, and store the encryption key', async () => {
    mockStorage.save.mockResolvedValue('uploads/test-file-private.pdf');
    mockRepository.create.mockImplementation(async (doc) => doc);

    const result = await useCase.execute({ ...validProps, isPrivate: true });

    expect(mockStorage.save).toHaveBeenCalled();
    expect(result.isPrivate).toBe(true);
    expect(result.encryptionKey).toHaveLength(64);

    const savedBuffer = mockStorage.save.mock.calls[0][1];
    expect(savedBuffer).not.toEqual(validProps.fileBuffer);

    const decrypted = decryptWithKey(savedBuffer, result.encryptionKey);
    expect(decrypted).toEqual(validProps.fileBuffer);
  });

  it('should pass the raw (unencrypted) buffer to pdf-parse even for private documents', async () => {
    mockStorage.save.mockResolvedValue('uploads/private.pdf');
    mockRepository.create.mockImplementation(async (doc) => doc);

    await useCase.execute({ ...validProps, isPrivate: true });

    // pdf-parse must receive the ORIGINAL buffer, not the encrypted one
    expect(pdfParseMock).toHaveBeenCalledWith(validProps.fileBuffer);
  });

  // ----------------------------------------------------------------
  // Validation errors
  // ----------------------------------------------------------------

  it('should throw InvalidDocumentException if the file buffer is empty', async () => {
    const invalidProps = { ...validProps, fileBuffer: Buffer.alloc(0) };

    await expect(useCase.execute(invalidProps)).rejects.toThrow(
      InvalidDocumentException,
    );
    expect(mockStorage.save).not.toHaveBeenCalled();
    expect(pdfParseMock).not.toHaveBeenCalled();
  });

  it('should throw InvalidDocumentException if the document title is empty', async () => {
    mockStorage.save.mockResolvedValue('uploads/test-file.pdf');
    const invalidProps = { ...validProps, title: '' };

    await expect(useCase.execute(invalidProps)).rejects.toThrow(
      InvalidDocumentException,
    );
  });

  it('should throw InvalidDocumentException if sizeBytes is zero', async () => {
    mockStorage.save.mockResolvedValue('uploads/test-file.pdf');
    const invalidProps = { ...validProps, sizeBytes: 0 };

    await expect(useCase.execute(invalidProps)).rejects.toThrow(
      InvalidDocumentException,
    );
  });
});
