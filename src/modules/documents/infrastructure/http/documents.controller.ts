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
  UseGuards,
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
import { JwtAuthGuard } from '../../../auth/infrastructure/http/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Documents')
@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly createDocumentUseCase: CreateDocumentUseCase,
    private readonly deleteDocumentUseCase: DeleteDocumentUseCase,
    private readonly listDocumentsUseCase: ListDocumentsUseCase,
    private readonly streamDocumentUseCase: StreamDocumentUseCase,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Fazer upload de um arquivo PDF' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: 'Arquivo PDF para upload' },
        title: { type: 'string', description: 'Título do documento' },
        author: { type: 'string', description: 'Autor do documento (opcional)' },
        tags: { type: 'string', description: 'Tags separadas por vírgula ou JSON array' },
      },
      required: ['file', 'title'],
    },
  })
  @ApiResponse({ status: 201, description: 'Documento criado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados de entrada ou arquivo inválidos.' })
  @ApiResponse({ status: 401, description: 'Token de autenticação não fornecido ou inválido.' })
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateDocumentDto,
    @CurrentUser() user: any,
  ) {
    if (!user || !user.id) {
      throw new BadRequestException('Usuário não autenticado.');
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
      userId: user.id,
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
  @ApiOperation({ summary: 'Listar documentos com paginação e busca' })
  @ApiResponse({ status: 200, description: 'Lista de documentos e metadados de paginação.' })
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
  @ApiOperation({ summary: 'Obter stream do arquivo PDF para leitura progressiva' })
  @ApiResponse({ status: 200, description: 'Stream do arquivo PDF.' })
  @ApiResponse({ status: 404, description: 'Documento não encontrado.' })
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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deletar um documento' })
  @ApiResponse({ status: 200, description: 'Documento deletado com sucesso.' })
  @ApiResponse({ status: 401, description: 'Token de autenticação não fornecido ou inválido.' })
  @ApiResponse({ status: 403, description: 'Sem permissão para deletar este documento.' })
  @ApiResponse({ status: 404, description: 'Documento não encontrado.' })
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    if (!user || !user.id) {
      throw new BadRequestException('Usuário não autenticado.');
    }

    await this.deleteDocumentUseCase.execute({
      id,
      userId: user.id,
    });

    return { message: 'Documento deletado com sucesso.' };
  }
}
