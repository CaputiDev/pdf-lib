import { DocumentEntity } from '../entities/document.entity';
import { IDocumentRepository } from '../interfaces/document.repository.interface';
import { IStorageAdapter } from '../interfaces/storage.interface';
import { DocumentNotFoundException } from '../exceptions/document.exceptions';

export interface StreamDocumentOutput {
  stream: NodeJS.ReadableStream;
  document: DocumentEntity;
}

export class StreamDocumentUseCase {
  constructor(
    private readonly documentRepository: IDocumentRepository,
    private readonly storageAdapter: IStorageAdapter,
  ) {}

  async execute(id: string): Promise<StreamDocumentOutput> {
    // 1. Buscar o documento no repositório
    const document = await this.documentRepository.findById(id);
    if (!document) {
      throw new DocumentNotFoundException(id);
    }

    // 2. Obter a stream de leitura física do storage
    const stream = await this.storageAdapter.getStream(document.filePath);

    return {
      stream,
      document,
    };
  }
}
