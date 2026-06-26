import type { ITokenStorage } from '@core/ports/ITokenStorage';
import { ApiError } from './ApiError';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

interface RequestOptions {
  headers?: Record<string, string>;
  body?: unknown;
  /** When `true` the raw `Response` is returned instead of parsed JSON. */
  raw?: boolean;
}

/**
 * Thin Fetch wrapper used by all HTTP-based repositories.
 *
 * Responsibilities:
 * - Prepend the base URL.
 * - Attach `Authorization: Bearer <token>` when a token exists.
 * - Parse JSON responses and throw `ApiError` for non-2xx.
 * - On 401 clear the stored token and redirect to `/login`.
 */
export class HttpClient {
  private readonly baseUrl: string;
  private readonly tokenStorage: ITokenStorage;

  constructor(baseUrl: string, tokenStorage: ITokenStorage) {
    this.baseUrl = baseUrl;
    this.tokenStorage = tokenStorage;
  }

  async get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('GET', path, options);
  }

  async post<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('POST', path, options);
  }

  async patch<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('PATCH', path, options);
  }

  async delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('DELETE', path, options);
  }

  // ── internal ────────────────────────────────────────────────────────

  private async request<T>(
    method: HttpMethod,
    path: string,
    options: RequestOptions = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      ...options.headers,
    };

    // Inject JWT if available
    const token = this.tokenStorage.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Only set Content-Type for JSON bodies (not for FormData)
    if (options.body !== undefined && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const fetchInit: RequestInit = {
      method,
      headers,
      body:
        options.body instanceof FormData
          ? options.body
          : options.body !== undefined
            ? JSON.stringify(options.body)
            : undefined,
    };

    const response = await fetch(url, fetchInit);

    if (!response.ok) {
      // 401 → clear credentials and redirect
      if (response.status === 401) {
        this.tokenStorage.clearToken();
        window.location.href = '/login';
      }

      throw await ApiError.fromResponse(response);
    }

    // Some callers need the raw Response (e.g. blob streaming)
    if (options.raw) {
      return response as unknown as T;
    }

    // 204 No Content — nothing to parse
    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }
}
