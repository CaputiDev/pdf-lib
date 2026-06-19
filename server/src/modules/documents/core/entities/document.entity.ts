import * as crypto from 'crypto';
import { TagEntity } from './tag.entity';

export class DocumentEntity {
  readonly id: string;
  readonly title: string;
  readonly author: string | null;
  readonly sizeBytes: number;
  readonly filePath: string;
  readonly uploadedAt: Date;
  readonly userId: string;
  readonly tags: TagEntity[];
  readonly isPrivate: boolean;
  readonly encryptionKey: string | null;

  constructor(properties: {
    id: string;
    title: string;
    author: string | null;
    sizeBytes: number;
    filePath: string;
    uploadedAt: Date;
    userId: string;
    tags?: TagEntity[];
    isPrivate?: boolean;
    encryptionKey?: string | null;
  }) {
    this.id = properties.id;
    this.title = properties.title;
    this.author = properties.author;
    this.sizeBytes = properties.sizeBytes;
    this.filePath = properties.filePath;
    this.uploadedAt = properties.uploadedAt;
    this.userId = properties.userId;
    this.tags = properties.tags ?? [];
    this.isPrivate = properties.isPrivate ?? false;
    this.encryptionKey = properties.encryptionKey ?? null;
  }

  static create(properties: {
    title: string;
    author?: string | null;
    sizeBytes: number;
    filePath: string;
    userId: string;
    tags?: TagEntity[];
    isPrivate?: boolean;
    encryptionKey?: string | null;
    id?: string;
    uploadedAt?: Date;
  }): DocumentEntity {
    if (!properties.title || properties.title.trim() === '') {
      throw new Error('O título do documento não pode ser vazio.');
    }

    if (!properties.filePath || properties.filePath.trim() === '') {
      throw new Error('O caminho do arquivo não pode ser vazio.');
    }

    if (properties.sizeBytes <= 0) {
      throw new Error('O tamanho do arquivo deve ser maior que zero bytes.');
    }

    if (!properties.userId || properties.userId.trim() === '') {
      throw new Error('O identificador do usuário proprietário é obrigatório.');
    }

    return new DocumentEntity({
      id: properties.id ?? crypto.randomUUID(),
      title: properties.title.trim(),
      author: properties.author?.trim() ?? null,
      sizeBytes: properties.sizeBytes,
      filePath: properties.filePath,
      uploadedAt: properties.uploadedAt ?? new Date(),
      userId: properties.userId,
      tags: properties.tags,
      isPrivate: properties.isPrivate ?? false,
      encryptionKey: properties.encryptionKey ?? null,
    });
  }
}
