import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../config/prisma/prisma.service';
import { IDocumentRepository, FindAllFilters } from '../../core/interfaces/document.repository.interface';
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
      tags: doc.tags.map((t) => new TagEntity({ id: t.id, name: t.name })),
    });
  }

  async findAll(filters: FindAllFilters): Promise<{ documents: DocumentEntity[]; total: number }> {
    const where: any = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { author: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.tag) {
      where.tags = {
        some: {
          name: { equals: filters.tag.toLowerCase() },
        },
      };
    }

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
            tags: doc.tags.map((t) => new TagEntity({ id: t.id, name: t.name })),
          }),
      ),
      total,
    };
  }

  async delete(id: string): Promise<void> {
    await this.prisma.document.delete({
      where: { id },
    });
  }
}
