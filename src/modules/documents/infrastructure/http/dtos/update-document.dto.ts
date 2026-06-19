import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateDocumentDto {
  @ApiProperty({ description: 'Novo título do documento', required: false })
  @IsString()
  @IsNotEmpty({ message: 'O título do documento não pode ser vazio.' })
  @IsOptional()
  title?: string;

  @ApiProperty({ description: 'Novo autor do documento', required: false, nullable: true })
  @IsString()
  @IsOptional()
  author?: string;

  @ApiProperty({
    description: 'Novas tags do documento (como array de strings ou lista separada por vírgula)',
    type: [String],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed.map((tag: any) => String(tag).trim());
        }
      } catch {
        return value.split(',').map((tag: string) => tag.trim());
      }
    }
    return value;
  })
  tags?: string[];
}
