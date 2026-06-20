export interface Document {
  id: string;
  title: string;
  author: string | null;
  sizeBytes: number;
  filePath: string;
  uploadedAt: string;
  isPrivate: boolean;
  userId: string;
  tags: string[];
}
