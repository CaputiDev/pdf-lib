import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsController } from './documents.controller';
import { CreateDocumentUseCase } from '../../core/use-cases/create-document.use-case';
import { DeleteDocumentUseCase } from '../../core/use-cases/delete-document.use-case';
import { ListDocumentsUseCase } from '../../core/use-cases/list-documents.use-case';
import { StreamDocumentUseCase } from '../../core/use-cases/stream-document.use-case';
import { DocumentEntity } from '../../core/entities/document.entity';
import { TagEntity } from '../../core/entities/tag.entity';
import { BadRequestException, StreamableFile } from '@nestjs/common';
import { Readable } from 'stream';

describe('DocumentsController', () => {
  let controller: DocumentsController;
  let createUseCase: jest.Mocked<CreateDocumentUseCase>;
  let deleteUseCase: jest.Mocked<DeleteDocumentUseCase>;
  let listUseCase: jest.Mocked<ListDocumentsUseCase>;
  let streamUseCase: jest.Mocked<StreamDocumentUseCase>;

  beforeEach(async () => {
    const mockCreateUseCase = { execute: jest.fn() };
    const mockDeleteUseCase = { execute: jest.fn() };
    const mockListUseCase = { execute: jest.fn() };
    const mockStreamUseCase = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentsController],
      providers: [
        { provide: CreateDocumentUseCase, useValue: mockCreateUseCase },
        { provide: DeleteDocumentUseCase, useValue: mockDeleteUseCase },
        { provide: ListDocumentsUseCase, useValue: mockListUseCase },
        { provide: StreamDocumentUseCase, useValue: mockStreamUseCase },
      ],
    }).compile();

    controller = module.get<DocumentsController>(DocumentsController);
    createUseCase = module.get(CreateDocumentUseCase);
    deleteUseCase = module.get(DeleteDocumentUseCase);
    listUseCase = module.get(ListDocumentsUseCase);
    streamUseCase = module.get(StreamDocumentUseCase);
  });

  const mockFile = {
    originalname: 'test.pdf',
    buffer: Buffer.from('pdf content'),
    size: 1024,
    mimetype: 'application/pdf',
  } as Express.Multer.File;

  const mockDocument = new DocumentEntity({
    id: 'doc-uuid',
    title: 'Test Title',
    author: 'Author Name',
    sizeBytes: 1024,
    filePath: 'uploads/test.pdf',
    uploadedAt: new Date(),
    userId: 'user-uuid',
    tags: [new TagEntity({ id: 'tag-1', name: 'pdf' })],
  });

  describe('create', () => {
    it('should create a document successfully', async () => {
      createUseCase.execute.mockResolvedValue(mockDocument);

      const dto = { title: 'Test Title', author: 'Author Name', tags: ['pdf'] };
      const result = await controller.create(mockFile, dto, 'user-uuid');

      expect(createUseCase.execute).toHaveBeenCalledWith({
        title: dto.title,
        author: dto.author,
        fileName: mockFile.originalname,
        fileBuffer: mockFile.buffer,
        sizeBytes: mockFile.size,
        userId: 'user-uuid',
        tags: dto.tags,
      });
      expect(result.id).toBe('doc-uuid');
      expect(result.tags).toEqual(['pdf']);
    });

    it('should throw BadRequestException if x-user-id is missing', async () => {
      await expect(
        controller.create(mockFile, { title: 'Test' }, ''),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if file is missing', async () => {
      await expect(
        controller.create(undefined as any, { title: 'Test' }, 'user-uuid'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if file mimetype is not PDF', async () => {
      const invalidFile = { ...mockFile, mimetype: 'image/png' } as any;
      await expect(
        controller.create(invalidFile, { title: 'Test' }, 'user-uuid'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return list of documents', async () => {
      listUseCase.execute.mockResolvedValue({
        documents: [mockDocument],
        total: 1,
        page: 1,
        limit: 10,
        pages: 1,
      });

      const query = { page: 1, limit: 10 };
      const result = await controller.findAll(query, 'user-uuid');

      expect(listUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-uuid',
        page: 1,
        limit: 10,
      });
      expect(result.documents).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('stream', () => {
    it('should set headers and return StreamableFile', async () => {
      const mockStream = Readable.from(['pdf content']);
      streamUseCase.execute.mockResolvedValue({
        stream: mockStream,
        document: mockDocument,
      });

      const res = {
        set: jest.fn(),
      } as any;

      const result = await controller.stream('doc-uuid', res);

      expect(streamUseCase.execute).toHaveBeenCalledWith('doc-uuid');
      expect(res.set).toHaveBeenCalledWith({
        'Content-Type': 'application/pdf',
        'Content-Disposition': expect.stringContaining('filename='),
      });
      expect(result).toBeInstanceOf(StreamableFile);
    });
  });

  describe('delete', () => {
    it('should delete a document successfully', async () => {
      deleteUseCase.execute.mockResolvedValue(undefined);

      const result = await controller.delete('doc-uuid', 'user-uuid');

      expect(deleteUseCase.execute).toHaveBeenCalledWith({
        id: 'doc-uuid',
        userId: 'user-uuid',
      });
      expect(result).toEqual({ message: 'Documento deletado com sucesso.' });
    });

    it('should throw BadRequestException if x-user-id is missing', async () => {
      await expect(controller.delete('doc-uuid', '')).rejects.toThrow(BadRequestException);
    });
  });
});
