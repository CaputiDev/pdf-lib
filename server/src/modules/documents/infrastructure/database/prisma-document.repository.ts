import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../config/prisma/prisma.service';
import {
  IDocumentRepository,
  FindAllFilters,
} from '../../core/interfaces/document.repository.interface';
import { DocumentEntity } from '../../core/entities/document.entity';
import { TagEntity } from '../../core/entities/tag.entity';

@Injectable()
export class PrismaDocumentRepository implements IDocumentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(document: DocumentEntity): Promise<DocumentEntity> {
    const created = await this.prisma.document.create({
      data: {
        id: document.id,
        title: document.title,
        author: document.author,
        sizeBytes: document.sizeBytes,
        filePath: document.filePath,
        uploadedAt: document.uploadedAt,
        userId: document.userId,
        isPrivate: document.isPrivate,
        encryptionKey: document.encryptionKey,
        tags: {
          connectOrCreate: document.tags.map((tag) => ({
            where: { name: tag.name },
            create: { id: tag.id, name: tag.name },
          })),
        },
      },
      include: {
        tags: true,
      },
    });

    return new DocumentEntity({
      id: created.id,
      title: created.title,
      author: created.author,
      sizeBytes: created.sizeBytes,
      filePath: created.filePath,
      uploadedAt: created.uploadedAt,
      userId: created.userId,
      isPrivate: created.isPrivate,
      encryptionKey: created.encryptionKey,
      tags: created.tags.map((t) => new TagEntity({ id: t.id, name: t.name })),
    });
  }

  async findById(id: string): Promise<DocumentEntity | null> {
    const doc = await this.prisma.document.findUnique({
      where: { id },
      include: { tags: true },
    });

    if (!doc) {
      return null;
    }

    return new DocumentEntity({
      id: doc.id,
      title: doc.title,
      author: doc.author,
      sizeBytes: doc.sizeBytes,
      filePath: doc.filePath,
      uploadedAt: doc.uploadedAt,
      userId: doc.userId,
      isPrivate: doc.isPrivate,
      encryptionKey: doc.encryptionKey,
      tags: doc.tags.map((t) => new TagEntity({ id: t.id, name: t.name })),
    });
  }

  async findAll(
    filters: FindAllFilters,
  ): Promise<{ documents: DocumentEntity[]; total: number }> {
    const conditions: any[] = [];

    // Privacy / Visibility condition
    if (filters.userId) {
      if (filters.currentUserId && filters.userId === filters.currentUserId) {
        conditions.push({ userId: filters.userId });
      } else {
        conditions.push({ userId: filters.userId });
        conditions.push({ isPrivate: false });
      }
    } else {
      if (filters.currentUserId) {
        conditions.push({
          OR: [{ isPrivate: false }, { userId: filters.currentUserId }],
        });
      } else {
        conditions.push({ isPrivate: false });
      }
    }

    // Search condition
    if (filters.search) {
      conditions.push({
        OR: [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { author: { contains: filters.search, mode: 'insensitive' } },
        ],
      });
    }

    // Tag condition
    if (filters.tag) {
      conditions.push({
        tags: {
          some: {
            name: { equals: filters.tag.toLowerCase() },
          },
        },
      });
    }

    // Username condition
    if (filters.username) {
      conditions.push({
        user: {
          name: { contains: filters.username, mode: 'insensitive' },
        },
      });
    }

    const where = conditions.length > 0 ? { AND: conditions } : {};

    const [docs, total] = await this.prisma.$transaction([
      this.prisma.document.findMany({
        where,
        include: { tags: true },
        skip: filters.skip,
        take: filters.take,
        orderBy: { uploadedAt: 'desc' },
      }),
      this.prisma.document.count({ where }),
    ]);

    return {
      documents: docs.map(
        (doc) =>
          new DocumentEntity({
            id: doc.id,
            title: doc.title,
            author: doc.author,
            sizeBytes: doc.sizeBytes,
            filePath: doc.filePath,
            uploadedAt: doc.uploadedAt,
            userId: doc.userId,
            isPrivate: doc.isPrivate,
            encryptionKey: doc.encryptionKey,
            tags: doc.tags.map(
              (t) => new TagEntity({ id: t.id, name: t.name }),
            ),
          }),
      ),
      total,
    };
  }

  async update(document: DocumentEntity): Promise<DocumentEntity> {
    const updated = await this.prisma.document.update({
      where: { id: document.id },
      data: {
        title: document.title,
        author: document.author,
        isPrivate: document.isPrivate,
        encryptionKey: document.encryptionKey,
        tags: {
          set: [],
          connectOrCreate: document.tags.map((tag) => ({
            where: { name: tag.name },
            create: { id: tag.id, name: tag.name },
          })),
        },
      },
      include: {
        tags: true,
      },
    });

    return new DocumentEntity({
      id: updated.id,
      title: updated.title,
      author: updated.author,
      sizeBytes: updated.sizeBytes,
      filePath: updated.filePath,
      uploadedAt: updated.uploadedAt,
      userId: updated.userId,
      isPrivate: updated.isPrivate,
      encryptionKey: updated.encryptionKey,
      tags: updated.tags.map((t) => new TagEntity({ id: t.id, name: t.name })),
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.document.delete({
      where: { id },
    });
  }
}
