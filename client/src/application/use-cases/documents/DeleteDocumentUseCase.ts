import type { IDocumentRepository } from '@core/ports/IDocumentRepository';

/**
 * Deletes a document by ID.
 *
 * Pure TS class — no framework dependencies.
 */
export class DeleteDocumentUseCase {
  private readonly documentRepository: IDocumentRepository;

  constructor(documentRepository: IDocumentRepository) {
    this.documentRepository = documentRepository;
  }

  async execute(id: string): Promise<void> {
    return this.documentRepository.delete(id);
  }
}
