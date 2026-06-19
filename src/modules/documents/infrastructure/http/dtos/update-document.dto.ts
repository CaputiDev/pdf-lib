/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return */
import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateDocumentDto {
  @ApiProperty({ description: 'Novo título do documento', required: false })
  @IsString()
  @IsNotEmpty({ message: 'O título do documento não pode ser vazio.' })
  @IsOptional()
  title?: string;

  @ApiProperty({
    description: 'Novo autor do documento',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  author?: string;

  @ApiProperty({
    description:
      'Novas tags do documento (como array de strings ou lista separada por vírgula)',
    type: [String],
    required: false,
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
}
