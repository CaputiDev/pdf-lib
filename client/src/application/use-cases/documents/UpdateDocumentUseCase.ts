import type {
  IDocumentRepository,
  UpdateDocumentInput,
} from '@core/ports/IDocumentRepository';
import type { Document } from '@core/domain/entities/Document';

/**
 * Updates metadata of an existing document.
 *
 * Pure TS class — no framework dependencies.
 */
export class UpdateDocumentUseCase {
  private readonly documentRepository: IDocumentRepository;

  constructor(documentRepository: IDocumentRepository) {
    this.documentRepository = documentRepository;
  }

  async execute(id: string, input: UpdateDocumentInput): Promise<Document> {
    return this.documentRepository.update(id, input);
  }
}
