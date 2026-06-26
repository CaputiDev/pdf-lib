import { createContext, useMemo, type ReactNode } from 'react';
import type { IAuthRepository } from '@core/ports/IAuthRepository';
import type { IDocumentRepository } from '@core/ports/IDocumentRepository';
import type { ITokenStorage } from '@core/ports/ITokenStorage';
import { LocalTokenStorage } from '../storage/LocalTokenStorage';
import { HttpClient } from '../http/HttpClient';
import { AuthHttpRepository } from '../http/AuthHttpRepository';
import { DocumentHttpRepository } from '../http/DocumentHttpRepository';

/**
 * All dependencies that flow through the DI container.
 *
 * Use-cases and hooks receive these via the `useDeps()` hook — never
 * import concrete implementations directly.
 */
export interface Deps {
  authRepository: IAuthRepository;
  documentRepository: IDocumentRepository;
  tokenStorage: ITokenStorage;
}

/**
 * React Context that holds the dependency graph.
 *
 * Intentionally initialised with `null` — accessing it outside a
 * `<DepsProvider>` throws via `useDeps()`.
 */
export const DepsContext = createContext<Deps | null>(null);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined ?? 'http://localhost:3000';

/**
 * Provides concrete implementations to the whole component tree.
 *
 * Dependencies are constructed **once** (via `useMemo`) so every
 * re-render of the provider doesn't re-allocate the object graph.
 */
export function DepsProvider({ children }: { children: ReactNode }) {
  const deps = useMemo<Deps>(() => {
    const tokenStorage = new LocalTokenStorage();
    const httpClient = new HttpClient(API_BASE_URL, tokenStorage);
    const authRepository = new AuthHttpRepository(httpClient);
    const documentRepository = new DocumentHttpRepository(
      httpClient,
      API_BASE_URL,
      tokenStorage,
    );

    return { authRepository, documentRepository, tokenStorage };
  }, []);

  return <DepsContext.Provider value={deps}>{children}</DepsContext.Provider>;
}
