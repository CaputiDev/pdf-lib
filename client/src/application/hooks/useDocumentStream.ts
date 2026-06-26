import { useState, useEffect, useCallback } from 'react';
import { useDeps } from '@infra/di/useDeps';
import { StreamDocumentUseCase } from '../use-cases/documents/StreamDocumentUseCase';

interface StreamState {
  data: string | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook that streams a PDF and returns an Object URL.
 *
 * - On mount (or when `documentId` changes), fetches the blob and
 *   creates an Object URL via `URL.createObjectURL`.
 * - On unmount (or re-fetch), revokes the previous URL to avoid memory
 *   leaks.
 * - Exposes `{ data, isLoading, error }` following the standard state
 *   pattern.
 */
export function useDocumentStream(documentId: string | null) {
  const { documentRepository } = useDeps();

  const [state, setState] = useState<StreamState>({
    data: null,
    isLoading: false,
    error: null,
  });

  const fetchStream = useCallback(
    async (id: string) => {
      setState({ data: null, isLoading: true, error: null });

      try {
        const useCase = new StreamDocumentUseCase(documentRepository);
        const objectUrl = await useCase.execute(id);

        setState({ data: objectUrl, isLoading: false, error: null });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load PDF';
        setState({ data: null, isLoading: false, error: message });
      }
    },
    [documentRepository],
  );

  useEffect(() => {
    if (!documentId) {
      setState({ data: null, isLoading: false, error: null });
      return;
    }

    void fetchStream(documentId);

    // Cleanup: revoke the Object URL to free memory
    return () => {
      setState((prev) => {
        if (prev.data) {
          URL.revokeObjectURL(prev.data);
        }
        return prev;
      });
    };
  }, [documentId, fetchStream]);

  return {
    data: state.data,
    isLoading: state.isLoading,
    error: state.error,
  };
}
