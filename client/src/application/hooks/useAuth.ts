import { useState, useCallback } from 'react';
import { useDeps } from '@infra/di/useDeps';
import { LoginUseCase } from '../use-cases/auth/LoginUseCase';
import { RegisterUseCase } from '../use-cases/auth/RegisterUseCase';
import type { LoginInput, RegisterInput } from '@core/ports/IAuthRepository';
import type { User } from '@core/domain/entities/User';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook that manages authentication state and actions.
 *
 * - `login()` stores the token via `ITokenStorage` and sets `user`.
 * - `register()` creates the account (does not auto-login).
 * - `logout()` clears the token and resets `user` to `null`.
 * - `isAuthenticated` is derived from token existence + expiry.
 */
export function useAuth() {
  const { authRepository, tokenStorage } = useDeps();

  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: false,
    error: null,
  });

  const login = useCallback(
    async (input: LoginInput) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const loginUseCase = new LoginUseCase(authRepository);
        const result = await loginUseCase.execute(input);

        tokenStorage.setToken(result.token, result.expiresAt);
        setState({ user: result.user, isLoading: false, error: null });

        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Login failed';
        setState((prev) => ({ ...prev, isLoading: false, error: message }));
        throw err;
      }
    },
    [authRepository, tokenStorage],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const registerUseCase = new RegisterUseCase(authRepository);
        await registerUseCase.execute(input);

        setState((prev) => ({ ...prev, isLoading: false, error: null }));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Registration failed';
        setState((prev) => ({ ...prev, isLoading: false, error: message }));
        throw err;
      }
    },
    [authRepository],
  );

  const logout = useCallback(() => {
    tokenStorage.clearToken();
    setState({ user: null, isLoading: false, error: null });
  }, [tokenStorage]);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const isAuthenticated = state.user !== null && !tokenStorage.isExpired();

  return {
    user: state.user,
    isLoading: state.isLoading,
    error: state.error,
    isAuthenticated,
    login,
    register,
    logout,
    clearError,
  };
}
