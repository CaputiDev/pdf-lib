import { DocumentEntity } from './document.entity';
import { TagEntity } from './tag.entity';
import { InvalidDocumentException } from '../exceptions/document.exceptions';

describe('DocumentEntity', () => {
  const validProps = {
    title: '  My Document  ',
    author: '  Jane Doe  ',
    sizeBytes: 2048,
    filePath: 'uploads/my_document.pdf',
    userId: 'user-uuid',
    tags: [TagEntity.create({ name: 'pdf' })],
  };

  it('should create a valid document entity with trimmed properties', () => {
    const doc = DocumentEntity.create(validProps);

    expect(doc.id).toBeDefined();
    expect(doc.title).toBe('My Document');
    expect(doc.author).toBe('Jane Doe');
    expect(doc.sizeBytes).toBe(2048);
    expect(doc.filePath).toBe('uploads/my_document.pdf');
    expect(doc.userId).toBe('user-uuid');
    expect(doc.tags).toHaveLength(1);
    expect(doc.tags[0].name).toBe('pdf');
    expect(doc.isPrivate).toBe(false);
    expect(doc.encryptionKey).toBeNull();
  });

  it('should create a private document with encryption key', () => {
    const doc = DocumentEntity.create({
      ...validProps,
      isPrivate: true,
      encryptionKey: 'secretkeyhex',
    });

    expect(doc.isPrivate).toBe(true);
    expect(doc.encryptionKey).toBe('secretkeyhex');
  });

  it('should throw InvalidDocumentException if title is empty or whitespace', () => {
    expect(() =>
      DocumentEntity.create({
        ...validProps,
        title: '',
      }),
    ).toThrow(InvalidDocumentException);

    expect(() =>
      DocumentEntity.create({
        ...validProps,
        title: '   ',
      }),
    ).toThrow(InvalidDocumentException);
  });

  it('should throw InvalidDocumentException if filePath is empty or whitespace', () => {
    expect(() =>
      DocumentEntity.create({
        ...validProps,
        filePath: '',
      }),
    ).toThrow(InvalidDocumentException);

    expect(() =>
      DocumentEntity.create({
        ...validProps,
        filePath: '   ',
      }),
    ).toThrow(InvalidDocumentException);
  });

  it('should throw InvalidDocumentException if sizeBytes is zero or negative', () => {
    expect(() =>
      DocumentEntity.create({
        ...validProps,
        sizeBytes: 0,
      }),
    ).toThrow(InvalidDocumentException);

    expect(() =>
      DocumentEntity.create({
        ...validProps,
        sizeBytes: -10,
      }),
    ).toThrow(InvalidDocumentException);
  });

  it('should throw InvalidDocumentException if userId is empty or whitespace', () => {
    expect(() =>
      DocumentEntity.create({
        ...validProps,
        userId: '',
      }),
    ).toThrow(InvalidDocumentException);

    expect(() =>
      DocumentEntity.create({
        ...validProps,
        userId: '   ',
      }),
    ).toThrow(InvalidDocumentException);
  });
});
