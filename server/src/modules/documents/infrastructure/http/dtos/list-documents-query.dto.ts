import { IsString, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListDocumentsQueryDto {
  @ApiPropertyOptional({
    description:
      'Termo de busca para título ou autor (busca insensível a maiúsculas/minúsculas)',
    example: 'manual',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filtrar os documentos por uma tag específica',
    example: 'pdf',
  })
  @IsString()
  @IsOptional()
  tag?: string;

  @ApiPropertyOptional({
    description: 'Número da página a ser retornada (para paginação)',
    default: 1,
    minimum: 1,
    example: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({
    description: 'Quantidade de documentos por página (para paginação)',
    default: 10,
    minimum: 1,
    example: 10,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number;
}
