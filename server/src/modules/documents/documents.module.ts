import { Module } from '@nestjs/common';
import { DocumentsController } from './infrastructure/http/documents.controller';
import { PrismaDocumentRepository } from './infrastructure/database/prisma-document.repository';
import { LocalStorageAdapter } from './infrastructure/storage/local-storage.adapter';
import { IDocumentRepository } from './core/interfaces/document.repository.interface';
import { IStorageAdapter } from './core/interfaces/storage.interface';
import { CreateDocumentUseCase } from './core/use-cases/create-document.use-case';
import { DeleteDocumentUseCase } from './core/use-cases/delete-document.use-case';
import { ListDocumentsUseCase } from './core/use-cases/list-documents.use-case';
import { StreamDocumentUseCase } from './core/use-cases/stream-document.use-case';
import { UpdateDocumentUseCase } from './core/use-cases/update-document.use-case';

@Module({
  controllers: [DocumentsController],
  providers: [
    {
      provide: 'IDocumentRepository',
      useClass: PrismaDocumentRepository,
    },
    {
      provide: 'IStorageAdapter',
      useClass: LocalStorageAdapter,
    },
    {
      provide: CreateDocumentUseCase,
      useFactory: (repo: IDocumentRepository, storage: IStorageAdapter) => {
        return new CreateDocumentUseCase(repo, storage);
      },
      inject: ['IDocumentRepository', 'IStorageAdapter'],
    },
    {
      provide: DeleteDocumentUseCase,
      useFactory: (repo: IDocumentRepository, storage: IStorageAdapter) => {
        return new DeleteDocumentUseCase(repo, storage);
      },
      inject: ['IDocumentRepository', 'IStorageAdapter'],
    },
    {
      provide: ListDocumentsUseCase,
      useFactory: (repo: IDocumentRepository) => {
        return new ListDocumentsUseCase(repo);
      },
      inject: ['IDocumentRepository'],
    },
    {
      provide: StreamDocumentUseCase,
      useFactory: (repo: IDocumentRepository, storage: IStorageAdapter) => {
        return new StreamDocumentUseCase(repo, storage);
      },
      inject: ['IDocumentRepository', 'IStorageAdapter'],
    },
    {
      provide: UpdateDocumentUseCase,
      useFactory: (repo: IDocumentRepository) => {
        return new UpdateDocumentUseCase(repo);
      },
      inject: ['IDocumentRepository'],
    },
  ],
  exports: [
    CreateDocumentUseCase,
    DeleteDocumentUseCase,
    ListDocumentsUseCase,
    StreamDocumentUseCase,
    UpdateDocumentUseCase,
  ],
})
export class DocumentsModule {}
