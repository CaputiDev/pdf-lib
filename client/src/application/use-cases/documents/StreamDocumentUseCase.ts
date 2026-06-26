import type { IDocumentRepository } from '@core/ports/IDocumentRepository';

/**
 * Streams a PDF document and returns an Object URL.
 *
 * The caller is responsible for revoking the URL via
 * `URL.revokeObjectURL()` in a cleanup function.
 *
 * Pure TS class — no framework dependencies.
 */
export class StreamDocumentUseCase {
  private readonly documentRepository: IDocumentRepository;

  constructor(documentRepository: IDocumentRepository) {
    this.documentRepository = documentRepository;
  }

  /**
   * @returns Object URL pointing to the PDF blob.
   */
  async execute(id: string): Promise<string> {
    return this.documentRepository.stream(id);
  }
}
