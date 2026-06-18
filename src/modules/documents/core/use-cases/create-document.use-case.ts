import { DocumentEntity } from '../entities/document.entity';
import { TagEntity } from '../entities/tag.entity';
import { IDocumentRepository } from '../interfaces/document.repository.interface';
import { IStorageAdapter } from '../interfaces/storage.interface';
import { InvalidDocumentException } from '../exceptions/document.exceptions';

export interface CreateDocumentInput {
  title: string;
  author?: string | null;
  fileName: string;
  fileBuffer: Buffer;
  sizeBytes: number;
  userId: string;
  tags?: string[];
}

export class CreateDocumentUseCase {
  constructor(
    private readonly documentRepository: IDocumentRepository,
    private readonly storageAdapter: IStorageAdapter,
  ) {}

  async execute(input: CreateDocumentInput): Promise<DocumentEntity> {
    try {
      if (!input.fileBuffer || input.fileBuffer.length === 0) {
        throw new InvalidDocumentException('O arquivo enviado está vazio.');
      }

      // 1. Salvar o arquivo físico no storage
      const filePath = await this.storageAdapter.save(input.fileName, input.fileBuffer);

      // 2. Mapear as strings de tags para TagEntity
      const tagEntities = (input.tags ?? []).map((name) =>
        TagEntity.create({ name }),
      );

      // 3. Criar a entidade de domínio do documento
      const document = DocumentEntity.create({
        title: input.title,
        author: input.author,
        sizeBytes: input.sizeBytes,
        filePath,
        userId: input.userId,
        tags: tagEntities,
      });

      // 4. Salvar os metadados do documento no repositório
      return await this.documentRepository.create(document);
    } catch (error: any) {
      if (
        error instanceof InvalidDocumentException
      ) {
        throw error;
      }
      throw new InvalidDocumentException(error.message);
    }
  }
}
