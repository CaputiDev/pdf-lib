import { DocumentEntity } from '../entities/document.entity';
import { IDocumentRepository } from '../interfaces/document.repository.interface';
import { IStorageAdapter } from '../interfaces/storage.interface';
import {
  DocumentNotFoundException,
  UnauthorizedDocumentException,
  InvalidDocumentException,
} from '../exceptions/document.exceptions';
import { decryptWithKey } from '../../../../common/utils/crypto.utils';
import { Readable } from 'stream';

export interface StreamDocumentOutput {
  stream: NodeJS.ReadableStream;
  document: DocumentEntity;
}

export interface StreamDocumentInput {
  id: string;
  currentUserId?: string;
}

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) =>
      chunks.push(Buffer.from(chunk as string | Buffer)),
    );
    stream.on('error', (err) =>
      reject(err instanceof Error ? err : new Error(String(err))),
    );
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

export class StreamDocumentUseCase {
  constructor(
    private readonly documentRepository: IDocumentRepository,
    private readonly storageAdapter: IStorageAdapter,
  ) {}

  async execute(input: StreamDocumentInput): Promise<StreamDocumentOutput> {
    // 1. Buscar o documento no repositório
    const document = await this.documentRepository.findById(input.id);
    if (!document) {
      throw new DocumentNotFoundException(input.id);
    }

    // 2. Se for privado, validar posse
    if (document.isPrivate) {
      if (!input.currentUserId || document.userId !== input.currentUserId) {
        throw new UnauthorizedDocumentException(
          'You do not have permission to access this private document.',
        );
      }
    }

    // 3. Obter a stream de leitura física do storage
    const stream = await this.storageAdapter.getStream(document.filePath);

    let finalStream = stream;

    // 4. Se for privado, descriptografar o arquivo
    if (document.isPrivate) {
      if (!document.encryptionKey) {
        throw new InvalidDocumentException(
          'Missing encryption key for private document.',
        );
      }

      const encryptedBuffer = await streamToBuffer(stream);
      const decryptedBuffer = decryptWithKey(
        encryptedBuffer,
        document.encryptionKey,
      );
      finalStream = Readable.from(decryptedBuffer);
    }

    return {
      stream: finalStream,
      document,
    };
  }
}
