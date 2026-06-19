export interface IStorageAdapter {
  save(fileName: string, fileBuffer: Buffer): Promise<string>;
  delete(filePath: string): Promise<void>;
  getStream(filePath: string): Promise<NodeJS.ReadableStream>;
}
