import type {
  IAuthRepository,
  RegisterInput,
  LoginInput,
  LoginResult,
} from '@core/ports/IAuthRepository';
import type { User } from '@core/domain/entities/User';
import type { HttpClient } from './HttpClient';

/** Raw shape returned by `POST /auth/login` */
interface LoginResponse {
  access_token: string;
  user: User;
}

/**
 * HTTP implementation of `IAuthRepository`.
 *
 * Maps the backend's `access_token` naming to the domain's `token` and
 * computes `expiresAt` from the JWT payload's `exp` claim.
 */
export class AuthHttpRepository implements IAuthRepository {
  private readonly http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  async register(input: RegisterInput): Promise<void> {
    await this.http.post('/auth/register', { body: input });
  }

  async login(input: LoginInput): Promise<LoginResult> {
    const data = await this.http.post<LoginResponse>('/auth/login', {
      body: input,
    });

    const expiresAt = this.extractExpFromJwt(data.access_token);

    return {
      token: data.access_token,
      user: data.user,
      expiresAt,
    };
  }

  // ── helpers ───────────────────────────────────────────────────────

  /**
   * Decode the `exp` claim from the JWT payload.
   * Falls back to "24 hours from now" if decoding fails.
   */
  private extractExpFromJwt(token: string): number {
    try {
      const payloadB64 = token.split('.')[1];
      if (!payloadB64) throw new Error('Invalid JWT');

      const payload = JSON.parse(atob(payloadB64)) as { exp?: number };
      if (typeof payload.exp === 'number') {
        return payload.exp * 1000; // convert seconds → ms
      }
    } catch {
      /* fall through */
    }

    // Fallback: 24 h from now (matches server's `expiresIn: '1d'`)
    return Date.now() + 24 * 60 * 60 * 1000;
  }
}
