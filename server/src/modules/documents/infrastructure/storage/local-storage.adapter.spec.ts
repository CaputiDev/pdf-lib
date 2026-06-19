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
    it('should create directory, write file, and return sanitized relative path', async () => {
      const fileName = 'My Test Document.PDF';
      const buffer = Buffer.from('hello');

      (fs.promises.mkdir as jest.Mock).mockResolvedValue(undefined);
      (fs.promises.writeFile as jest.Mock).mockResolvedValue(undefined);
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const result = await adapter.save(fileName, buffer);

      expect(fs.promises.mkdir).toHaveBeenCalledWith(expect.any(String), {
        recursive: true,
      });
      expect(fs.promises.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('my_test_document.pdf'),
        buffer,
      );
      expect(result).toBe('uploads/my_test_document.pdf');
    });

    it('should append an incremented suffix if a file with the same name already exists', async () => {
      const fileName = 'test.pdf';
      const buffer = Buffer.from('hello');

      (fs.promises.mkdir as jest.Mock).mockResolvedValue(undefined);
      (fs.promises.writeFile as jest.Mock).mockResolvedValue(undefined);
      // First check (test.pdf) exists, second check (test_1.pdf) exists, third check (test_2.pdf) does not exist
      (fs.existsSync as jest.Mock)
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);

      const result = await adapter.save(fileName, buffer);

      expect(result).toBe('uploads/test_2.pdf');
    });
  });

  describe('delete', () => {
    it('should unlink the file', async () => {
      (fs.promises.unlink as jest.Mock).mockResolvedValue(undefined);

      await adapter.delete('uploads/test-file.pdf');

      expect(fs.promises.unlink).toHaveBeenCalledWith(
        expect.stringContaining(path.join('uploads-test', 'test-file.pdf')),
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
        expect.stringContaining(path.join('uploads-test', 'file.pdf')),
      );
      expect(fs.createReadStream).toHaveBeenCalledWith(
        expect.stringContaining(path.join('uploads-test', 'file.pdf')),
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
