import { Injectable } from '@nestjs/common';
import { IStorageAdapter } from '../../core/interfaces/storage.interface';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class LocalStorageAdapter implements IStorageAdapter {
  private readonly uploadDir: string;

  constructor() {
    const folder = process.env.NODE_ENV === 'test' ? 'uploads-test' : 'uploads';
    this.uploadDir = path.resolve(process.cwd(), folder);
  }

  async save(fileName: string, fileBuffer: Buffer): Promise<string> {
    // Ensure upload directory exists
    await fs.promises.mkdir(this.uploadDir, { recursive: true });

    const fileExt = path.extname(fileName).toLowerCase();
    const rawBaseName = path
      .basename(fileName, path.extname(fileName))
      .toLowerCase()
      .replace(/\s+/g, '_');

    let uniqueName = `${rawBaseName}${fileExt}`;
    let fullPath = path.join(this.uploadDir, uniqueName);
    let counter = 1;

    while (fs.existsSync(fullPath)) {
      uniqueName = `${rawBaseName}_${counter}${fileExt}`;
      fullPath = path.join(this.uploadDir, uniqueName);
      counter++;
    }

    await fs.promises.writeFile(fullPath, fileBuffer);

    // Return the relative path starting with 'uploads/'
    return path.join('uploads', uniqueName).replace(/\\/g, '/');
  }

  async delete(filePath: string): Promise<void> {
    const fullPath = this.getAbsolutePath(filePath);
    try {
      await fs.promises.unlink(fullPath);
    } catch (error: any) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/require-await
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

    // If it starts with 'uploads/', resolve it using the configured uploadDir
    if (filePath.startsWith('uploads/')) {
      const relativePart = filePath.substring('uploads/'.length);
      return path.join(this.uploadDir, relativePart);
    }
    if (filePath.startsWith('uploads\\')) {
      const relativePart = filePath.substring('uploads\\'.length);
      return path.join(this.uploadDir, relativePart);
    }

    return path.resolve(process.cwd(), filePath);
  }
}
