/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return */
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { Transform } from 'class-transformer';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDocumentDto {
  @ApiProperty({
    description: 'O título do documento PDF',
    example: 'Manual do Usuário',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    description: 'O autor do documento PDF (opcional)',
    example: 'João da Silva',
  })
  @IsString()
  @IsOptional()
  author?: string;

  @ApiPropertyOptional({
    description:
      'Tags associadas ao documento (pode ser uma string separada por vírgulas ou JSON array de strings)',
    type: [String],
    example: ['pdf', 'documento'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      if (value.trim() === '') {
        return [];
      }
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed
            .map((tag: any) => String(tag).trim())
            .filter((tag) => tag !== '');
        }
      } catch {
        return value
          .split(',')
          .map((tag: string) => tag.trim())
          .filter((tag) => tag !== '');
      }
    }
    if (Array.isArray(value)) {
      return value
        .map((tag: any) => String(tag).trim())
        .filter((tag) => tag !== '');
    }
    return value;
  })
  tags?: string[];

  @ApiPropertyOptional({
    description:
      'Define se o documento é privado (apenas o criador poderá ver/descriptografar)',
    default: false,
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  isPrivate?: boolean;
}
