import { DocumentEntity } from '../entities/document.entity';
import { IDocumentRepository } from '../interfaces/document.repository.interface';

export interface ListDocumentsInput {
  userId?: string;
  search?: string;
  tag?: string;
  page?: number;
  limit?: number;
}

export interface ListDocumentsOutput {
  documents: DocumentEntity[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export class ListDocumentsUseCase {
  constructor(private readonly documentRepository: IDocumentRepository) {}

  async execute(input: ListDocumentsInput): Promise<ListDocumentsOutput> {
    const page = input.page ?? 1;
    const limit = input.limit ?? 10;
    const take = limit;
    const skip = (page - 1) * limit;

    const { documents, total } = await this.documentRepository.findAll({
      userId: input.userId,
      search: input.search,
      tag: input.tag,
      skip,
      take,
    });

    const pages = Math.ceil(total / limit);

    return {
      documents,
      total,
      page,
      limit,
      pages,
    };
  }
}
