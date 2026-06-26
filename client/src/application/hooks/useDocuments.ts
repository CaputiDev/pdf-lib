import { useState, useEffect, useCallback, useRef } from 'react';
import { useDeps } from '@infra/di/useDeps';
import { ListDocumentsUseCase } from '../use-cases/documents/ListDocumentsUseCase';
import type { ListDocumentsFilter } from '@core/ports/IDocumentRepository';
import type { Document } from '@core/domain/entities/Document';
import type { PaginationMeta } from '@core/domain/value-objects/PaginationMeta';

interface DocumentsState {
  data: Document[];
  meta: PaginationMeta | null;
  isLoading: boolean;
  error: string | null;
}

const DEBOUNCE_MS = 300;

/**
 * Hook for listing documents with pagination and debounced search.
 *
 * - Debounces `filter` changes by 300ms to avoid spamming the API on
 *   every keystroke.
 * - Exposes `{ data, meta, isLoading, error }` following the standard
 *   state pattern.
 * - `refetch()` forces a fresh request.
 */
export function useDocuments(filter: ListDocumentsFilter) {
  const { documentRepository } = useDeps();

  const [state, setState] = useState<DocumentsState>({
    data: [],
    meta: null,
    isLoading: true,
    error: null,
  });

  const filterRef = useRef(filter);
  filterRef.current = filter;

  const fetchDocuments = useCallback(
    async (currentFilter: ListDocumentsFilter) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const useCase = new ListDocumentsUseCase(documentRepository);
        const result = await useCase.execute(currentFilter);

        setState({
          data: result.documents,
          meta: {
            total: result.total,
            page: result.page,
            limit: result.limit,
            pages: result.pages,
          },
          isLoading: false,
          error: null,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load documents';
        setState((prev) => ({ ...prev, isLoading: false, error: message }));
      }
    },
    [documentRepository],
  );

  // Debounced effect: re-fetches when filter changes
  useEffect(() => {
    const timerId = setTimeout(() => {
      void fetchDocuments(filterRef.current);
    }, DEBOUNCE_MS);

    return () => clearTimeout(timerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- we intentionally depend on serialized filter
  }, [
    filter.search,
    filter.tag,
    filter.username,
    filter.page,
    filter.limit,
    fetchDocuments,
  ]);

  const refetch = useCallback(() => {
    void fetchDocuments(filterRef.current);
  }, [fetchDocuments]);

  return {
    data: state.data,
    meta: state.meta,
    isLoading: state.isLoading,
    error: state.error,
    refetch,
  };
}
