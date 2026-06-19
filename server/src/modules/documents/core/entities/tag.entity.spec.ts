import { TagEntity } from './tag.entity';
import { InvalidDocumentException } from '../exceptions/document.exceptions';

describe('TagEntity', () => {
  it('should create a valid tag in lowercase and trimmed', () => {
    const tag = TagEntity.create({ name: '  PDF  ' });
    expect(tag.name).toBe('pdf');
    expect(tag.id).toBeDefined();
  });

  it('should allow letters with accents and numbers', () => {
    const tag1 = TagEntity.create({ name: 'Ação' });
    expect(tag1.name).toBe('ação');

    const tag2 = TagEntity.create({ name: 'música123' });
    expect(tag2.name).toBe('música123');
  });

  it('should throw InvalidDocumentException if name is empty', () => {
    expect(() => TagEntity.create({ name: '' })).toThrow(
      InvalidDocumentException,
    );
    expect(() => TagEntity.create({ name: '   ' })).toThrow(
      InvalidDocumentException,
    );
  });

  it('should throw InvalidDocumentException if name contains symbols', () => {
    expect(() => TagEntity.create({ name: 'pdf-lib' })).toThrow(
      InvalidDocumentException,
    );
    expect(() => TagEntity.create({ name: 'pdf_lib' })).toThrow(
      InvalidDocumentException,
    );
    expect(() => TagEntity.create({ name: 'tag!' })).toThrow(
      InvalidDocumentException,
    );
    expect(() => TagEntity.create({ name: '@tag' })).toThrow(
      InvalidDocumentException,
    );
  });

  it('should throw InvalidDocumentException if name contains spaces', () => {
    expect(() => TagEntity.create({ name: 'pdf reader' })).toThrow(
      InvalidDocumentException,
    );
  });
});
