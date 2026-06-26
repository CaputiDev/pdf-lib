import type { ITokenStorage } from '@core/ports/ITokenStorage';

const STORAGE_KEY = 'pdf_lib_auth';

interface StoredAuth {
  token: string;
  expiresAt: number;
}

/**
 * Persists `{ token, expiresAt }` in `localStorage`.
 *
 * - `isExpired()` compares the stored `expiresAt` with `Date.now()`.
 * - If no entry exists, the token is treated as absent (not expired).
 */
export class LocalTokenStorage implements ITokenStorage {
  getToken(): string | null {
    const stored = this.read();
    if (!stored) return null;
    return stored.token;
  }

  setToken(token: string, expiresAt: number): void {
    const data: StoredAuth = { token, expiresAt };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  clearToken(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  isExpired(): boolean {
    const stored = this.read();
    if (!stored) return true;
    return Date.now() >= stored.expiresAt;
  }

  // ── helpers ───────────────────────────────────────────────────────

  private read(): StoredAuth | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as StoredAuth;
    } catch {
      return null;
    }
  }
}
