import { IDocumentRepository } from '../interfaces/document.repository.interface';
import { IStorageAdapter } from '../interfaces/storage.interface';
import {
  DocumentNotFoundException,
  UnauthorizedDocumentException,
} from '../exceptions/document.exceptions';

export interface DeleteDocumentInput {
  id: string;
  userId: string;
}

export class DeleteDocumentUseCase {
  constructor(
    private readonly documentRepository: IDocumentRepository,
    private readonly storageAdapter: IStorageAdapter,
  ) {}

  async execute(input: DeleteDocumentInput): Promise<void> {
    // 1. Buscar o documento para verificar existência e proprietário
    const document = await this.documentRepository.findById(input.id);
    if (!document) {
      throw new DocumentNotFoundException(input.id);
    }

    // 2. Verificar se o usuário solicitante é o proprietário
    if (document.userId !== input.userId) {
      throw new UnauthorizedDocumentException(
        'Você não tem permissão para deletar este documento.',
      );
    }

    // 3. Remover o arquivo físico do storage
    await this.storageAdapter.delete(document.filePath);

    // 4. Remover os metadados do repositório
    await this.documentRepository.delete(input.id);
  }
}
