/**
 * Normalized API error.
 *
 * Wraps every non-2xx HTTP response so that consumers can rely on a
 * single shape (status + message) instead of inspecting raw Response objects.
 */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }

  /** Convenience check — e.g. `if (err.is(401)) …` */
  is(status: number): boolean {
    return this.status === status;
  }

  /** Build an `ApiError` from a Fetch `Response`. */
  static async fromResponse(response: Response): Promise<ApiError> {
    let message: string = response.statusText || 'Request failed';

    try {
      const body: unknown = await response.json();
      if (
        typeof body === 'object' &&
        body !== null &&
        'message' in body
      ) {
        const msg = (body as Record<string, unknown>).message;
        if (typeof msg === 'string') {
          message = msg;
        }
      }
    } catch {
      /* body is not JSON — keep statusText */
    }

    return new ApiError(response.status, message);
  }
}
