import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
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
import { UpdateDocumentUseCase } from '../../core/use-cases/update-document.use-case';
import { CreateDocumentDto } from './dtos/create-document.dto';
import { ListDocumentsQueryDto } from './dtos/list-documents-query.dto';
import { UpdateDocumentDto } from './dtos/update-document.dto';
import { JwtAuthGuard } from '../../../auth/infrastructure/http/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../../auth/infrastructure/http/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
  ApiHeader,
} from '@nestjs/swagger';

interface AuthenticatedUser {
  id: string;
  email: string;
}

@ApiTags('Documents')
@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly createDocumentUseCase: CreateDocumentUseCase,
    private readonly deleteDocumentUseCase: DeleteDocumentUseCase,
    private readonly listDocumentsUseCase: ListDocumentsUseCase,
    private readonly streamDocumentUseCase: StreamDocumentUseCase,
    private readonly updateDocumentUseCase: UpdateDocumentUseCase,
  ) { }

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
        file: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo PDF para upload',
        },
        title: { type: 'string', description: 'Título do documento' },
        author: {
          type: 'string',
          description: 'Autor do documento (opcional)',
        },
        tags: {
          type: 'string',
          description: 'Tags separadas por vírgula ou JSON array',
        },
        isPrivate: {
          type: 'boolean',
          description: 'Define se o documento é privado e será criptografado',
          default: false,
        },
      },
      required: ['file', 'title'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Documento criado com sucesso.',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          format: 'uuid',
          example: 'f39ce2a6-b516-43d9-a7be-98782ee41870',
        },
        title: { type: 'string', example: 'Manual do Usuário' },
        author: { type: 'string', example: 'João da Silva', nullable: true },
        sizeBytes: { type: 'integer', example: 1048576 },
        filePath: { type: 'string', example: 'uploads/manual_do_usuario.pdf' },
        uploadedAt: {
          type: 'string',
          format: 'date-time',
          example: '2026-06-19T16:00:00.000Z',
        },
        userId: {
          type: 'string',
          format: 'uuid',
          example: 'e71ad06c-85a2-4a0b-9dfd-b4b3c965c822',
        },
        isPrivate: { type: 'boolean', example: false },
        tags: {
          type: 'array',
          items: { type: 'string' },
          example: ['pdf', 'documento'],
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Dados de entrada ou arquivo inválidos.',
  })
  @ApiResponse({
    status: 401,
    description: 'Token de autenticação não fornecido ou inválido.',
  })
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateDocumentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!user || !user.id) {
      throw new BadRequestException('User is not authenticated.');
    }
    if (!file) {
      throw new BadRequestException('PDF file is required.');
    }
    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Only PDF files are allowed.');
    }

    const document = await this.createDocumentUseCase.execute({
      title: dto.title,
      author: dto.author,
      fileName: file.originalname,
      fileBuffer: file.buffer,
      sizeBytes: file.size,
      userId: user.id,
      tags: dto.tags,
      isPrivate: dto.isPrivate,
    });

    return {
      id: document.id,
      title: document.title,
      author: document.author,
      sizeBytes: document.sizeBytes,
      filePath: document.filePath,
      uploadedAt: document.uploadedAt,
      userId: document.userId,
      isPrivate: document.isPrivate,
      tags: document.tags.map((t) => t.name),
    };
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar documentos com paginação e busca' })
  @ApiResponse({
    status: 200,
    description: 'Lista de documentos e metadados de paginação com sucesso.',
    schema: {
      type: 'object',
      properties: {
        documents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                format: 'uuid',
                example: 'f39ce2a6-b516-43d9-a7be-98782ee41870',
              },
              title: { type: 'string', example: 'Manual do Usuário' },
              author: {
                type: 'string',
                example: 'João da Silva',
                nullable: true,
              },
              sizeBytes: { type: 'integer', example: 1048576 },
              filePath: {
                type: 'string',
                example: 'uploads/manual_do_usuario.pdf',
              },
              uploadedAt: {
                type: 'string',
                format: 'date-time',
                example: '2026-06-19T16:00:00.000Z',
              },
              userId: {
                type: 'string',
                format: 'uuid',
                example: 'e71ad06c-85a2-4a0b-9dfd-b4b3c965c822',
              },
              isPrivate: { type: 'boolean', example: false },
              tags: {
                type: 'array',
                items: { type: 'string' },
                example: ['pdf', 'documento'],
              },
            },
          },
        },
        total: { type: 'integer', example: 1 },
        page: { type: 'integer', example: 1 },
        limit: { type: 'integer', example: 10 },
        pages: { type: 'integer', example: 1 },
      },
    },
  })
  async findAll(
    @Query() query: ListDocumentsQueryDto,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    const result = await this.listDocumentsUseCase.execute({
      currentUserId: user?.id,
      search: query.search,
      tag: query.tag,
      username: query.username,
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
        isPrivate: doc.isPrivate,
        tags: doc.tags.map((t) => t.name),
      })),
      total: result.total,
      page: result.page,
      limit: result.limit,
      pages: result.pages,
    };
  }

  @Get(':id/stream')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obter stream do arquivo PDF para leitura progressiva',
    description:
      'Permite streaming de arquivos PDF. Se o arquivo for privado, requer autenticação via cabeçalho Bearer.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'ID do documento (UUID)',
    example: 'f39ce2a6-b516-43d9-a7be-98782ee41870',
  })
  @ApiResponse({
    status: 200,
    description: 'Stream do arquivo PDF (application/pdf).',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para acessar este documento privado.',
  })
  @ApiResponse({ status: 404, description: 'Documento não encontrado.' })
  async stream(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    const { stream, document } = await this.streamDocumentUseCase.execute({
      id,
      currentUserId: user?.id,
    });

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
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'ID do documento a ser excluído (UUID)',
    example: 'f39ce2a6-b516-43d9-a7be-98782ee41870',
  })
  @ApiResponse({
    status: 200,
    description: 'Documento deletado com sucesso.',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Documento deletado com sucesso.' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token de autenticação não fornecido ou inválido.',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para deletar este documento.',
  })
  @ApiResponse({ status: 404, description: 'Documento não encontrado.' })
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!user || !user.id) {
      throw new BadRequestException('User is not authenticated.');
    }

    await this.deleteDocumentUseCase.execute({
      id,
      userId: user.id,
    });

    return { message: 'Documento deletado com sucesso.' };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Editar metadados de um documento' })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'ID do documento a ser editado (UUID)',
    example: 'f39ce2a6-b516-43d9-a7be-98782ee41870',
  })
  @ApiResponse({
    status: 200,
    description: 'Documento editado com sucesso.',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          format: 'uuid',
          example: 'f39ce2a6-b516-43d9-a7be-98782ee41870',
        },
        title: { type: 'string', example: 'Novo Título do PDF' },
        author: { type: 'string', example: 'Novo Autor', nullable: true },
        sizeBytes: { type: 'integer', example: 1048576 },
        filePath: { type: 'string', example: 'uploads/novo_titulo_do_pdf.pdf' },
        uploadedAt: {
          type: 'string',
          format: 'date-time',
          example: '2026-06-19T16:00:00.000Z',
        },
        userId: {
          type: 'string',
          format: 'uuid',
          example: 'e71ad06c-85a2-4a0b-9dfd-b4b3c965c822',
        },
        isPrivate: { type: 'boolean', example: false },
        tags: {
          type: 'array',
          items: { type: 'string' },
          example: ['pdf', 'atualizado'],
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dados de entrada inválidos.' })
  @ApiResponse({
    status: 401,
    description: 'Token de autenticação não fornecido ou inválido.',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para editar este documento.',
  })
  @ApiResponse({ status: 404, description: 'Documento não encontrado.' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateDocumentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!user || !user.id) {
      throw new BadRequestException('User is not authenticated.');
    }

    const document = await this.updateDocumentUseCase.execute({
      id,
      userId: user.id,
      title: dto.title,
      author: dto.author,
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
      isPrivate: document.isPrivate,
      tags: document.tags.map((t) => t.name),
    };
  }
}
