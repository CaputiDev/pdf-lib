import { Module } from '@nestjs/common';
import { DocumentsController } from './infrastructure/http/documents.controller';
import { PrismaDocumentRepository } from './infrastructure/database/prisma-document.repository';
import { LocalStorageAdapter } from './infrastructure/storage/local-storage.adapter';
import { CreateDocumentUseCase } from './core/use-cases/create-document.use-case';
import { DeleteDocumentUseCase } from './core/use-cases/delete-document.use-case';
import { ListDocumentsUseCase } from './core/use-cases/list-documents.use-case';
import { StreamDocumentUseCase } from './core/use-cases/stream-document.use-case';

@Module({
  controllers: [DocumentsController],
  providers: [
    PrismaDocumentRepository,
    LocalStorageAdapter,
    {
      provide: CreateDocumentUseCase,
      useFactory: (repo: PrismaDocumentRepository, storage: LocalStorageAdapter) => {
        return new CreateDocumentUseCase(repo, storage);
      },
      inject: [PrismaDocumentRepository, LocalStorageAdapter],
    },
    {
      provide: DeleteDocumentUseCase,
      useFactory: (repo: PrismaDocumentRepository, storage: LocalStorageAdapter) => {
        return new DeleteDocumentUseCase(repo, storage);
      },
      inject: [PrismaDocumentRepository, LocalStorageAdapter],
    },
    {
      provide: ListDocumentsUseCase,
      useFactory: (repo: PrismaDocumentRepository) => {
        return new ListDocumentsUseCase(repo);
      },
      inject: [PrismaDocumentRepository],
    },
    {
      provide: StreamDocumentUseCase,
      useFactory: (repo: PrismaDocumentRepository, storage: LocalStorageAdapter) => {
        return new StreamDocumentUseCase(repo, storage);
      },
      inject: [PrismaDocumentRepository, LocalStorageAdapter],
    },
  ],
  exports: [
    CreateDocumentUseCase,
    DeleteDocumentUseCase,
    ListDocumentsUseCase,
    StreamDocumentUseCase,
  ],
})
export class DocumentsModule {}
