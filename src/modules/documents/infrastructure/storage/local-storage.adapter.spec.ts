/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import { LocalStorageAdapter } from './local-storage.adapter';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('fs', () => {
  const original = jest.requireActual('fs');
  return {
    ...original,
    existsSync: jest.fn(),
    createReadStream: jest.fn(),
    promises: {
      mkdir: jest.fn(),
      writeFile: jest.fn(),
      unlink: jest.fn(),
    },
  };
});

describe('LocalStorageAdapter', () => {
  let adapter: LocalStorageAdapter;

  beforeEach(() => {
    adapter = new LocalStorageAdapter();
    jest.clearAllMocks();
  });

  describe('save', () => {
    it('should create directory, write file, and return relative path', async () => {
      const fileName = 'test.pdf';
      const buffer = Buffer.from('hello');

      (fs.promises.mkdir as jest.Mock).mockResolvedValue(undefined);
      (fs.promises.writeFile as jest.Mock).mockResolvedValue(undefined);

      const result = await adapter.save(fileName, buffer);

      expect(fs.promises.mkdir).toHaveBeenCalledWith(expect.any(String), {
        recursive: true,
      });
      expect(fs.promises.writeFile).toHaveBeenCalledWith(
        expect.any(String),
        buffer,
      );
      expect(result).toMatch(/^uploads\/test-\d+-/);
      expect(result.endsWith('.pdf')).toBe(true);
    });
  });

  describe('delete', () => {
    it('should unlink the file', async () => {
      (fs.promises.unlink as jest.Mock).mockResolvedValue(undefined);

      await adapter.delete('uploads/test-file.pdf');

      expect(fs.promises.unlink).toHaveBeenCalledWith(
        expect.stringContaining(path.join('uploads', 'test-file.pdf')),
      );
    });

    it('should ignore ENOENT error', async () => {
      const error = new Error('File not found') as any;
      error.code = 'ENOENT';
      (fs.promises.unlink as jest.Mock).mockRejectedValue(error);

      await expect(
        adapter.delete('uploads/non-existent.pdf'),
      ).resolves.not.toThrow();
    });

    it('should throw other errors', async () => {
      const error = new Error('Permission denied') as any;
      error.code = 'EACCES';
      (fs.promises.unlink as jest.Mock).mockRejectedValue(error);

      await expect(adapter.delete('uploads/file.pdf')).rejects.toThrow(
        'Permission denied',
      );
    });
  });

  describe('getStream', () => {
    it('should return read stream if file exists', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      const mockStream = {} as any;
      (fs.createReadStream as jest.Mock).mockReturnValue(mockStream);

      const stream = await adapter.getStream('uploads/file.pdf');

      expect(fs.existsSync).toHaveBeenCalledWith(
        expect.stringContaining(path.join('uploads', 'file.pdf')),
      );
      expect(fs.createReadStream).toHaveBeenCalledWith(
        expect.stringContaining(path.join('uploads', 'file.pdf')),
      );
      expect(stream).toBe(mockStream);
    });

    it('should throw error if file does not exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      await expect(
        adapter.getStream('uploads/non-existent.pdf'),
      ).rejects.toThrow('File not found at path');
    });
  });
});
