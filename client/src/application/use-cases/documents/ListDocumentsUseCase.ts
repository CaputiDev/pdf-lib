import type {
  IDocumentRepository,
  ListDocumentsFilter,
} from '@core/ports/IDocumentRepository';
import type { PaginatedDocuments } from '@core/domain/value-objects/PaginationMeta';

/**
 * Lists documents with optional filtering and pagination.
 *
 * Pure TS class — no framework dependencies.
 */
export class ListDocumentsUseCase {
  private readonly documentRepository: IDocumentRepository;

  constructor(documentRepository: IDocumentRepository) {
    this.documentRepository = documentRepository;
  }

  async execute(filter: ListDocumentsFilter): Promise<PaginatedDocuments> {
    return this.documentRepository.list(filter);
  }
}
