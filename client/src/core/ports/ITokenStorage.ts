export interface ITokenStorage {
  getToken(): string | null;
  setToken(token: string, expiresAt: number): void;
  clearToken(): void;
  isExpired(): boolean;
}
