/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaDocumentRepository } from './prisma-document.repository';
import { PrismaService } from '../../../../config/prisma/prisma.service';
import { DocumentEntity } from '../../core/entities/document.entity';
import { TagEntity } from '../../core/entities/tag.entity';

describe('PrismaDocumentRepository', () => {
  let repository: PrismaDocumentRepository;

  const mockPrismaService = {
    document: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaDocumentRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<PrismaDocumentRepository>(PrismaDocumentRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockDbDocument = {
    id: 'doc-id-1',
    title: 'Test Title',
    author: 'Test Author',
    sizeBytes: 12345,
    filePath: 'uploads/file.pdf',
    uploadedAt: new Date(),
    userId: 'user-id-123',
    tags: [
      { id: 'tag-id-1', name: 'pdf' },
      { id: 'tag-id-2', name: 'test' },
    ],
  };

  describe('create', () => {
    it('should create a document and return its entity', async () => {
      const documentEntity = DocumentEntity.create({
        id: 'doc-id-1',
        title: 'Test Title',
        author: 'Test Author',
        sizeBytes: 12345,
        filePath: 'uploads/file.pdf',
        userId: 'user-id-123',
        tags: [
          TagEntity.create({ id: 'tag-id-1', name: 'pdf' }),
          TagEntity.create({ id: 'tag-id-2', name: 'test' }),
        ],
      });

      mockPrismaService.document.create.mockResolvedValue(mockDbDocument);

      const result = await repository.create(documentEntity);

      expect(mockPrismaService.document.create).toHaveBeenCalledWith({
        data: {
          id: 'doc-id-1',
          title: 'Test Title',
          author: 'Test Author',
          sizeBytes: 12345,
          filePath: 'uploads/file.pdf',
          uploadedAt: expect.any(Date),
          userId: 'user-id-123',
          isPrivate: false,
          encryptionKey: null,
          tags: {
            connectOrCreate: [
              {
                where: { name: 'pdf' },
                create: { id: 'tag-id-1', name: 'pdf' },
              },
              {
                where: { name: 'test' },
                create: { id: 'tag-id-2', name: 'test' },
              },
            ],
          },
        },
        include: {
          tags: true,
        },
      });

      expect(result).toBeInstanceOf(DocumentEntity);
      expect(result.id).toBe('doc-id-1');
      expect(result.tags[0].name).toBe('pdf');
    });
  });

  describe('findById', () => {
    it('should return a DocumentEntity if document exists', async () => {
      mockPrismaService.document.findUnique.mockResolvedValue(mockDbDocument);

      const result = await repository.findById('doc-id-1');

      expect(mockPrismaService.document.findUnique).toHaveBeenCalledWith({
        where: { id: 'doc-id-1' },
        include: { tags: true },
      });
      expect(result).toBeInstanceOf(DocumentEntity);
      expect(result?.id).toBe('doc-id-1');
    });

    it('should return null if document does not exist', async () => {
      mockPrismaService.document.findUnique.mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return paginated and filtered documents', async () => {
      mockPrismaService.$transaction.mockResolvedValue([[mockDbDocument], 1]);

      const filters = {
        userId: 'user-id-123',
        search: 'Test',
        tag: 'pdf',
        skip: 0,
        take: 10,
      };

      const result = await repository.findAll(filters);

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(result.documents).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.documents[0]).toBeInstanceOf(DocumentEntity);
    });
  });

  describe('update', () => {
    it('should update a document and return the updated entity', async () => {
      const documentEntity = DocumentEntity.create({
        id: 'doc-id-1',
        title: 'New Title',
        author: 'New Author',
        sizeBytes: 12345,
        filePath: 'uploads/file.pdf',
        userId: 'user-id-123',
        tags: [
          TagEntity.create({ id: 'tag-id-1', name: 'pdf' }),
          TagEntity.create({ id: 'tag-id-3', name: 'newtag' }),
        ],
      });

      const mockUpdatedDbDocument = {
        ...mockDbDocument,
        title: 'New Title',
        author: 'New Author',
        tags: [
          { id: 'tag-id-1', name: 'pdf' },
          { id: 'tag-id-3', name: 'newtag' },
        ],
      };

      mockPrismaService.document.update.mockResolvedValue(
        mockUpdatedDbDocument,
      );

      const result = await repository.update(documentEntity);

      expect(mockPrismaService.document.update).toHaveBeenCalledWith({
        where: { id: 'doc-id-1' },
        data: {
          title: 'New Title',
          author: 'New Author',
          isPrivate: false,
          encryptionKey: null,
          tags: {
            set: [],
            connectOrCreate: [
              {
                where: { name: 'pdf' },
                create: { id: 'tag-id-1', name: 'pdf' },
              },
              {
                where: { name: 'newtag' },
                create: { id: 'tag-id-3', name: 'newtag' },
              },
            ],
          },
        },
        include: {
          tags: true,
        },
      });

      expect(result).toBeInstanceOf(DocumentEntity);
      expect(result.title).toBe('New Title');
      expect(result.author).toBe('New Author');
      expect(result.tags[1].name).toBe('newtag');
    });
  });

  describe('delete', () => {
    it('should call delete on prisma service', async () => {
      mockPrismaService.document.delete.mockResolvedValue(mockDbDocument);

      await repository.delete('doc-id-1');

      expect(mockPrismaService.document.delete).toHaveBeenCalledWith({
        where: { id: 'doc-id-1' },
      });
    });
  });
});
