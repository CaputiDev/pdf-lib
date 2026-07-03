// pdf-parse is a CommonJS module. Using require() at call-time ensures Jest mocks work correctly.
import { DocumentEntity } from '../entities/document.entity';
import { TagEntity } from '../entities/tag.entity';
import { IDocumentRepository } from '../interfaces/document.repository.interface';
import { IStorageAdapter } from '../interfaces/storage.interface';
import { InvalidDocumentException } from '../exceptions/document.exceptions';
import {
  generateRandomKeyHex,
  encryptWithKey,
} from '../../../../common/utils/crypto.utils';
import { extractKeywords } from '../../../../common/utils/keyword-extractor.utils';

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
        throw new InvalidDocumentException('The uploaded file is empty.');
      }

      // 1. Extract keywords from the raw buffer BEFORE encryption
      let autoKeywords: string[] = [];
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const parseFn = require('pdf-parse') as (
          buf: Buffer,
        ) => Promise<{ text: string }>;
        const parsed = await parseFn(input.fileBuffer);
        autoKeywords = extractKeywords(parsed.text);
      } catch {
        // If pdf-parse fails (e.g. non-PDF or corrupted file), skip auto-tagging silently
        autoKeywords = [];
      }

      const isPrivate = input.isPrivate ?? false;
      let finalFileBuffer = input.fileBuffer;
      let encryptionKey: string | null = null;

      if (isPrivate) {
        encryptionKey = generateRandomKeyHex();
        finalFileBuffer = encryptWithKey(input.fileBuffer, encryptionKey);
      }

      // 2. Save the physical file (encrypted or not)
      const filePath = await this.storageAdapter.save(
        input.fileName,
        finalFileBuffer,
      );

      // 3. Merge manual tags with auto-generated keywords (deduplicate by name)
      const manualTagNames = (input.tags ?? []).map((t) =>
        t.trim().toLowerCase(),
      );
      const allTagNames = [
        ...manualTagNames,
        ...autoKeywords.filter((kw) => !manualTagNames.includes(kw)),
      ];

      const tagEntities = allTagNames
        .filter((name) => name.length > 0)
        .map((name) => TagEntity.create({ name }));

      // 4. Build and persist the document entity
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

      return await this.documentRepository.create(document);
    } catch (error) {
      if (error instanceof InvalidDocumentException) {
        throw error;
      }
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown error while creating the document.';
      throw new InvalidDocumentException(message);
    }
  }
}
