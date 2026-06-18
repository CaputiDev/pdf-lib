import { ListDocumentsUseCase } from './list-documents.use-case';
import { IDocumentRepository } from '../interfaces/document.repository.interface';
import { DocumentEntity } from '../entities/document.entity';

describe('ListDocumentsUseCase', () => {
  let useCase: ListDocumentsUseCase;
  let mockRepository: jest.Mocked<IDocumentRepository>;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
    } as any;

    useCase = new ListDocumentsUseCase(mockRepository);
  });

  const mockDocs = [
    DocumentEntity.create({
      id: 'doc-1',
      title: 'Doc 1',
      sizeBytes: 100,
      filePath: 'path/1.pdf',
      userId: 'user-1',
    }),
    DocumentEntity.create({
      id: 'doc-2',
      title: 'Doc 2',
      sizeBytes: 200,
      filePath: 'path/2.pdf',
      userId: 'user-1',
    }),
  ];

  it('deve listar documentos com paginação e filtros', async () => {
    mockRepository.findAll.mockResolvedValue({
      documents: mockDocs,
      total: 2,
    });

    const result = await useCase.execute({
      userId: 'user-1',
      search: 'Doc',
      page: 1,
      limit: 10,
    });

    expect(mockRepository.findAll).toHaveBeenCalledWith({
      userId: 'user-1',
      search: 'Doc',
      tag: undefined,
      skip: 0,
      take: 10,
    });

    expect(result.documents).toEqual(mockDocs);
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
    expect(result.pages).toBe(1);
  });

  it('deve aplicar valores padrões de página e limite se não fornecidos', async () => {
    mockRepository.findAll.mockResolvedValue({
      documents: [],
      total: 0,
    });

    const result = await useCase.execute({});

    expect(mockRepository.findAll).toHaveBeenCalledWith({
      userId: undefined,
      search: undefined,
      tag: undefined,
      skip: 0,
      take: 10,
    });

    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
    expect(result.pages).toBe(0);
  });

  it('deve calcular páginas totais corretamente', async () => {
    mockRepository.findAll.mockResolvedValue({
      documents: mockDocs,
      total: 25,
    });

    const result = await useCase.execute({ page: 2, limit: 10 });

    expect(mockRepository.findAll).toHaveBeenCalledWith({
      userId: undefined,
      search: undefined,
      tag: undefined,
      skip: 10,
      take: 10,
    });

    expect(result.pages).toBe(3);
  });
});
