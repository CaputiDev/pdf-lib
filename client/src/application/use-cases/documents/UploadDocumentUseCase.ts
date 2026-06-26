import type {
  IDocumentRepository,
  CreateDocumentInput,
} from '@core/ports/IDocumentRepository';
import type { Document } from '@core/domain/entities/Document';

/**
 * Uploads a new PDF document.
 *
 * Pure TS class — no framework dependencies.
 */
export class UploadDocumentUseCase {
  private readonly documentRepository: IDocumentRepository;

  constructor(documentRepository: IDocumentRepository) {
    this.documentRepository = documentRepository;
  }

  async execute(input: CreateDocumentInput): Promise<Document> {
    return this.documentRepository.create(input);
  }
}
