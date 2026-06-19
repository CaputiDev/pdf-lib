import { DocumentEntity } from '../entities/document.entity';
import { TagEntity } from '../entities/tag.entity';
import { IDocumentRepository } from '../interfaces/document.repository.interface';
import {
  DocumentNotFoundException,
  UnauthorizedDocumentException,
  InvalidDocumentException,
} from '../exceptions/document.exceptions';

export interface UpdateDocumentInput {
  id: string;
  userId: string;
  title?: string;
  author?: string | null;
  tags?: string[];
}

export class UpdateDocumentUseCase {
  constructor(private readonly documentRepository: IDocumentRepository) {}

  async execute(input: UpdateDocumentInput): Promise<DocumentEntity> {
    try {
      const document = await this.documentRepository.findById(input.id);
      if (!document) {
        throw new DocumentNotFoundException(input.id);
      }

      if (document.userId !== input.userId) {
        throw new UnauthorizedDocumentException(
          'Você não tem permissão para editar este documento.',
        );
      }

      // Se tags foram informadas, mapeamos. Caso contrário, mantemos as atuais.
      let updatedTags = document.tags;
      if (input.tags !== undefined) {
        updatedTags = input.tags.map((name) => TagEntity.create({ name }));
      }

      const updatedDocument = DocumentEntity.create({
        id: document.id,
        title: input.title !== undefined ? input.title : document.title,
        author: input.author !== undefined ? input.author : document.author,
        sizeBytes: document.sizeBytes,
        filePath: document.filePath,
        userId: document.userId,
        uploadedAt: document.uploadedAt,
        tags: updatedTags,
      });

      return await this.documentRepository.update(updatedDocument);
    } catch (error) {
      if (
        error instanceof DocumentNotFoundException ||
        error instanceof UnauthorizedDocumentException ||
        error instanceof InvalidDocumentException
      ) {
        throw error;
      }
      const message =
        error instanceof Error
          ? error.message
          : 'Erro desconhecido ao atualizar o documento.';
      throw new InvalidDocumentException(message);
    }
  }
}
