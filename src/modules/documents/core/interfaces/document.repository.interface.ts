import { DocumentEntity } from '../entities/document.entity';

export interface FindAllFilters {
  userId?: string;
  search?: string;
  tag?: string;
  skip?: number;
  take?: number;
}

export interface IDocumentRepository {
  create(document: DocumentEntity): Promise<DocumentEntity>;
  findById(id: string): Promise<DocumentEntity | null>;
  findAll(filters: FindAllFilters): Promise<{ documents: DocumentEntity[]; total: number }>;
  update(document: DocumentEntity): Promise<DocumentEntity>;
  delete(id: string): Promise<void>;
}
