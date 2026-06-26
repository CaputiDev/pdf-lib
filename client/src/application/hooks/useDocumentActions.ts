import { useState, useCallback } from 'react';
import { useDeps } from '@infra/di/useDeps';
import { UploadDocumentUseCase } from '../use-cases/documents/UploadDocumentUseCase';
import { UpdateDocumentUseCase } from '../use-cases/documents/UpdateDocumentUseCase';
import { DeleteDocumentUseCase } from '../use-cases/documents/DeleteDocumentUseCase';
import type { CreateDocumentInput, UpdateDocumentInput } from '@core/ports/IDocumentRepository';
import type { Document } from '@core/domain/entities/Document';

interface ActionState {
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook that exposes upload, update, and delete actions for documents.
 *
 * Each action follows the `{ isLoading, error }` pattern.
 * `uploadProgress` (0–100) is available during uploads.
 */
export function useDocumentActions() {
  const { documentRepository } = useDeps();

  const [state, setState] = useState<ActionState>({
    isLoading: false,
    error: null,
  });

  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const upload = useCallback(
    async (input: Omit<CreateDocumentInput, 'onProgress'>): Promise<Document> => {
      setState({ isLoading: true, error: null });
      setUploadProgress(0);

      try {
        const useCase = new UploadDocumentUseCase(documentRepository);
        const result = await useCase.execute({
          ...input,
          onProgress: (progress) => setUploadProgress(progress),
        });

        setState({ isLoading: false, error: null });
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed';
        setState({ isLoading: false, error: message });
        throw err;
      }
    },
    [documentRepository],
  );

  const update = useCallback(
    async (id: string, input: UpdateDocumentInput): Promise<Document> => {
      setState({ isLoading: true, error: null });

      try {
        const useCase = new UpdateDocumentUseCase(documentRepository);
        const result = await useCase.execute(id, input);

        setState({ isLoading: false, error: null });
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Update failed';
        setState({ isLoading: false, error: message });
        throw err;
      }
    },
    [documentRepository],
  );

  const remove = useCallback(
    async (id: string): Promise<void> => {
      setState({ isLoading: true, error: null });

      try {
        const useCase = new DeleteDocumentUseCase(documentRepository);
        await useCase.execute(id);

        setState({ isLoading: false, error: null });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Delete failed';
        setState({ isLoading: false, error: message });
        throw err;
      }
    },
    [documentRepository],
  );

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    isLoading: state.isLoading,
    error: state.error,
    uploadProgress,
    upload,
    update,
    remove,
    clearError,
  };
}
