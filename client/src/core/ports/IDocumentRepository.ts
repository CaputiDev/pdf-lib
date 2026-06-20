import type { Document } from '../domain/entities/Document';
import type { PaginatedDocuments } from '../domain/value-objects/PaginationMeta';

export interface ListDocumentsFilter {
  search?: string;
  tag?: string;
  username?: string;
  page?: number;
  limit?: number;
}

export interface CreateDocumentInput {
  file: File;
  title: string;
  author?: string;
  tags?: string[];
  isPrivate?: boolean;
  onProgress?: (progress: number) => void;
}

export interface UpdateDocumentInput {
  title?: string;
  author?: string;
  tags?: string[];
}

export interface IDocumentRepository {
  list(filter: ListDocumentsFilter): Promise<PaginatedDocuments>;
  getById(id: string): Promise<Document>;
  create(input: CreateDocumentInput): Promise<Document>;
  update(id: string, input: UpdateDocumentInput): Promise<Document>;
  delete(id: string): Promise<void>;
  stream(id: string): Promise<string>;
}
