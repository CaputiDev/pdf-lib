import { DocumentEntity } from '../entities/document.entity';
import { TagEntity } from '../entities/tag.entity';
import { IDocumentRepository } from '../interfaces/document.repository.interface';
import { IStorageAdapter } from '../interfaces/storage.interface';
import { InvalidDocumentException } from '../exceptions/document.exceptions';
import {
  generateRandomKeyHex,
  encryptWithKey,
} from '../../../../common/utils/crypto.utils';

export interface CreateDocumentInput {
  title: string;
  author?: string | null;
  fileName: string;
  fileBuffer: Buffer;
  sizeBytes: number;
  userId: string;
  tags?: string[];
  isPrivate?: boolean;
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

      const isPrivate = input.isPrivate ?? false;
      let finalFileBuffer = input.fileBuffer;
      let encryptionKey: string | null = null;

      if (isPrivate) {
        encryptionKey = generateRandomKeyHex();
        finalFileBuffer = encryptWithKey(input.fileBuffer, encryptionKey);
      }

      // 1. Salvar o arquivo físico no storage (seja criptografado ou não)
      const filePath = await this.storageAdapter.save(
        input.fileName,
        finalFileBuffer,
      );

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
        isPrivate,
        encryptionKey,
      });

      // 4. Salvar os metadados do documento no repositório
      return await this.documentRepository.create(document);
    } catch (error) {
      if (error instanceof InvalidDocumentException) {
        throw error;
      }
      const message =
        error instanceof Error
          ? error.message
          : 'Erro desconhecido ao criar o documento.';
      throw new InvalidDocumentException(message);
    }
  }
}
