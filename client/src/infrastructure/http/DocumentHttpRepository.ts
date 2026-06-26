import type {
  IDocumentRepository,
  ListDocumentsFilter,
  CreateDocumentInput,
  UpdateDocumentInput,
} from '@core/ports/IDocumentRepository';
import type { Document } from '@core/domain/entities/Document';
import type { PaginatedDocuments } from '@core/domain/value-objects/PaginationMeta';
import type { ITokenStorage } from '@core/ports/ITokenStorage';
import type { HttpClient } from './HttpClient';
import { ApiError } from './ApiError';

/**
 * HTTP implementation of `IDocumentRepository`.
 *
 * - `list`, `getById`, `update`, `delete` use the standard `HttpClient`.
 * - `create` uses `XMLHttpRequest` instead of `fetch` so that we get
 *   real upload progress via `xhr.upload.onprogress`.
 * - `stream` uses raw `fetch` to obtain a Blob and create an Object URL.
 */
export class DocumentHttpRepository implements IDocumentRepository {
  private readonly http: HttpClient;
  private readonly baseUrl: string;
  private readonly tokenStorage: ITokenStorage;

  constructor(http: HttpClient, baseUrl: string, tokenStorage: ITokenStorage) {
    this.http = http;
    this.baseUrl = baseUrl;
    this.tokenStorage = tokenStorage;
  }

  async list(filter: ListDocumentsFilter): Promise<PaginatedDocuments> {
    const params = new URLSearchParams();
    if (filter.search) params.set('search', filter.search);
    if (filter.tag) params.set('tag', filter.tag);
    if (filter.username) params.set('username', filter.username);
    if (filter.page !== undefined) params.set('page', String(filter.page));
    if (filter.limit !== undefined) params.set('limit', String(filter.limit));

    const qs = params.toString();
    const path = `/documents${qs ? `?${qs}` : ''}`;

    return this.http.get<PaginatedDocuments>(path);
  }

  async getById(id: string): Promise<Document> {
    return this.http.get<Document>(`/documents/${id}`);
  }

  async create(input: CreateDocumentInput): Promise<Document> {
    return new Promise<Document>((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', input.file);
      formData.append('title', input.title);

      if (input.author) {
        formData.append('author', input.author);
      }

      if (input.tags && input.tags.length > 0) {
        formData.append('tags', JSON.stringify(input.tags));
      }

      if (input.isPrivate !== undefined) {
        formData.append('isPrivate', String(input.isPrivate));
      }

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${this.baseUrl}/documents`);

      // Inject auth header
      const token = this.tokenStorage.getToken();
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      // Report upload progress
      if (input.onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            input.onProgress!(progress);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText) as Document);
          } catch {
            reject(new ApiError(xhr.status, 'Invalid JSON response'));
          }
        } else {
          // On 401, clear token and redirect (same behavior as HttpClient)
          if (xhr.status === 401) {
            this.tokenStorage.clearToken();
            window.location.href = '/login';
          }

          let message = 'Upload failed';
          try {
            const body = JSON.parse(xhr.responseText) as Record<string, unknown>;
            if (typeof body.message === 'string') {
              message = body.message;
            }
          } catch {
            /* keep default message */
          }
          reject(new ApiError(xhr.status, message));
        }
      };

      xhr.onerror = () => {
        reject(new ApiError(0, 'Network error during upload'));
      };

      xhr.send(formData);
    });
  }

  async update(id: string, input: UpdateDocumentInput): Promise<Document> {
    return this.http.patch<Document>(`/documents/${id}`, { body: input });
  }

  async delete(id: string): Promise<void> {
    await this.http.delete(`/documents/${id}`);
  }

  /**
   * Stream a PDF.
   *
   * Uses raw `fetch` (via `HttpClient.get` with `raw: true`) to get the
   * binary response, then returns an Object URL that can be passed
   * straight to an `<iframe>` or `<embed>`.
   *
   * The caller is responsible for revoking the URL via
   * `URL.revokeObjectURL` in a cleanup function.
   */
  async stream(id: string): Promise<string> {
    const response = await this.http.get<Response>(
      `/documents/${id}/stream`,
      { raw: true },
    );

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }
}
