/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return */
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateDocumentDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  author?: string;

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

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  isPrivate?: boolean;
}
