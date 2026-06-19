import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  Headers,
  Body,
  UploadedFile,
  UseInterceptors,
  Res,
  StreamableFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { Readable } from 'stream';
import { CreateDocumentUseCase } from '../../core/use-cases/create-document.use-case';
import { DeleteDocumentUseCase } from '../../core/use-cases/delete-document.use-case';
import { ListDocumentsUseCase } from '../../core/use-cases/list-documents.use-case';
import { StreamDocumentUseCase } from '../../core/use-cases/stream-document.use-case';
import { CreateDocumentDto } from './dtos/create-document.dto';
import { ListDocumentsQueryDto } from './dtos/list-documents-query.dto';

@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly createDocumentUseCase: CreateDocumentUseCase,
    private readonly deleteDocumentUseCase: DeleteDocumentUseCase,
    private readonly listDocumentsUseCase: ListDocumentsUseCase,
    private readonly streamDocumentUseCase: StreamDocumentUseCase,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateDocumentDto,
    @Headers('x-user-id') userId: string,
  ) {
    if (!userId || userId.trim() === '') {
      throw new BadRequestException('O cabeçalho x-user-id é obrigatório para esta operação.');
    }
    if (!file) {
      throw new BadRequestException('O arquivo PDF é obrigatório.');
    }
    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Apenas arquivos PDF são permitidos.');
    }

    const document = await this.createDocumentUseCase.execute({
      title: dto.title,
      author: dto.author,
      fileName: file.originalname,
      fileBuffer: file.buffer,
      sizeBytes: file.size,
      userId,
      tags: dto.tags,
    });

    return {
      id: document.id,
      title: document.title,
      author: document.author,
      sizeBytes: document.sizeBytes,
      filePath: document.filePath,
      uploadedAt: document.uploadedAt,
      userId: document.userId,
      tags: document.tags.map((t) => t.name),
    };
  }

  @Get()
  async findAll(
    @Query() query: ListDocumentsQueryDto,
    @Headers('x-user-id') userId?: string,
  ) {
    const result = await this.listDocumentsUseCase.execute({
      userId,
      search: query.search,
      tag: query.tag,
      page: query.page,
      limit: query.limit,
    });

    return {
      documents: result.documents.map((doc) => ({
        id: doc.id,
        title: doc.title,
        author: doc.author,
        sizeBytes: doc.sizeBytes,
        filePath: doc.filePath,
        uploadedAt: doc.uploadedAt,
        userId: doc.userId,
        tags: doc.tags.map((t) => t.name),
      })),
      total: result.total,
      page: result.page,
      limit: result.limit,
      pages: result.pages,
    };
  }

  @Get(':id/stream')
  async stream(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { stream, document } = await this.streamDocumentUseCase.execute(id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${encodeURIComponent(document.title)}.pdf"`,
    });

    return new StreamableFile(stream as Readable);
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string,
  ) {
    if (!userId || userId.trim() === '') {
      throw new BadRequestException('O cabeçalho x-user-id é obrigatório para esta operação.');
    }

    await this.deleteDocumentUseCase.execute({
      id,
      userId,
    });

    return { message: 'Documento deletado com sucesso.' };
  }
}
