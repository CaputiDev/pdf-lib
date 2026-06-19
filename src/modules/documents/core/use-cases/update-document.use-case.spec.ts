import { UpdateDocumentUseCase, UpdateDocumentInput } from './update-document.use-case';
import { DocumentEntity } from '../entities/document.entity';
import { TagEntity } from '../entities/tag.entity';
import { IDocumentRepository } from '../interfaces/document.repository.interface';
import {
  DocumentNotFoundException,
  UnauthorizedDocumentException,
  InvalidDocumentException,
} from '../exceptions/document.exceptions';

describe('UpdateDocumentUseCase', () => {
  let useCase: UpdateDocumentUseCase;
  let mockDocumentRepository: jest.Mocked<IDocumentRepository>;

  const mockExistingDocument = DocumentEntity.create({
    id: 'doc-id',
    title: 'Original Title',
    author: 'Original Author',
    sizeBytes: 500,
    filePath: 'uploads/file.pdf',
    userId: 'owner-id',
    tags: [TagEntity.create({ name: 'oldtag' })],
  });

  beforeEach(() => {
    mockDocumentRepository = {
      findById: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
    } as any;

    useCase = new UpdateDocumentUseCase(mockDocumentRepository);
  });

  it('should successfully update document details (title, author, tags) for the owner', async () => {
    mockDocumentRepository.findById.mockResolvedValue(mockExistingDocument);
    mockDocumentRepository.update.mockImplementation(async (doc) => doc);

    const input: UpdateDocumentInput = {
      id: 'doc-id',
      userId: 'owner-id',
      title: 'New Title',
      author: 'New Author',
      tags: ['newtag', 'anothertag'],
    };

    const result = await useCase.execute(input);

    expect(mockDocumentRepository.findById).toHaveBeenCalledWith('doc-id');
    expect(mockDocumentRepository.update).toHaveBeenCalled();
    expect(result.title).toBe('New Title');
    expect(result.author).toBe('New Author');
    expect(result.tags).toHaveLength(2);
    expect(result.tags[0].name).toBe('newtag');
    expect(result.tags[1].name).toBe('anothertag');
  });

  it('should successfully update only the title while keeping existing author and tags', async () => {
    mockDocumentRepository.findById.mockResolvedValue(mockExistingDocument);
    mockDocumentRepository.update.mockImplementation(async (doc) => doc);

    const input: UpdateDocumentInput = {
      id: 'doc-id',
      userId: 'owner-id',
      title: 'Updated Title',
    };

    const result = await useCase.execute(input);

    expect(result.title).toBe('Updated Title');
    expect(result.author).toBe('Original Author');
    expect(result.tags).toHaveLength(1);
    expect(result.tags[0].name).toBe('oldtag');
  });

  it('should throw DocumentNotFoundException if document does not exist', async () => {
    mockDocumentRepository.findById.mockResolvedValue(null);

    const input: UpdateDocumentInput = {
      id: 'invalid-id',
      userId: 'owner-id',
      title: 'New Title',
    };

    await expect(useCase.execute(input)).rejects.toThrow(DocumentNotFoundException);
    expect(mockDocumentRepository.update).not.toHaveBeenCalled();
  });

  it('should throw UnauthorizedDocumentException if user is not the owner', async () => {
    mockDocumentRepository.findById.mockResolvedValue(mockExistingDocument);

    const input: UpdateDocumentInput = {
      id: 'doc-id',
      userId: 'wrong-user-id',
      title: 'New Title',
    };

    await expect(useCase.execute(input)).rejects.toThrow(UnauthorizedDocumentException);
    expect(mockDocumentRepository.update).not.toHaveBeenCalled();
  });

  it('should throw InvalidDocumentException if updated title is empty', async () => {
    mockDocumentRepository.findById.mockResolvedValue(mockExistingDocument);

    const input: UpdateDocumentInput = {
      id: 'doc-id',
      userId: 'owner-id',
      title: '',
    };

    await expect(useCase.execute(input)).rejects.toThrow(InvalidDocumentException);
    expect(mockDocumentRepository.update).not.toHaveBeenCalled();
  });
});
