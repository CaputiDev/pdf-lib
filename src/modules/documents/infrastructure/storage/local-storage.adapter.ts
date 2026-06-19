import { Injectable } from '@nestjs/common';
import { IStorageAdapter } from '../../core/interfaces/storage.interface';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class LocalStorageAdapter implements IStorageAdapter {
  private readonly uploadDir: string;

  constructor() {
    this.uploadDir = path.resolve(process.cwd(), 'uploads');
  }

  async save(fileName: string, fileBuffer: Buffer): Promise<string> {
    // Ensure upload directory exists
    await fs.promises.mkdir(this.uploadDir, { recursive: true });

    // Generate unique name to avoid naming collisions
    const fileExt = path.extname(fileName);
    const baseName = path.basename(fileName, fileExt);
    const uniqueName = `${baseName}-${Date.now()}-${crypto.randomUUID()}${fileExt}`;
    const fullPath = path.join(this.uploadDir, uniqueName);

    await fs.promises.writeFile(fullPath, fileBuffer);

    // Return the relative path starting with 'uploads/'
    return path.join('uploads', uniqueName).replace(/\\/g, '/');
  }

  async delete(filePath: string): Promise<void> {
    const fullPath = this.getAbsolutePath(filePath);
    try {
      await fs.promises.unlink(fullPath);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  async getStream(filePath: string): Promise<NodeJS.ReadableStream> {
    const fullPath = this.getAbsolutePath(filePath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found at path: ${filePath}`);
    }
    return fs.createReadStream(fullPath);
  }

  private getAbsolutePath(filePath: string): string {
    if (path.isAbsolute(filePath)) {
      return filePath;
    }
    // If it starts with 'uploads/', resolve it from workspace root
    return path.resolve(process.cwd(), filePath);
  }
}
