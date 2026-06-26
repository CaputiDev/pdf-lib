import { useContext } from 'react';
import { DepsContext, type Deps } from './DepsContext';

/**
 * Typed hook to access the dependency container.
 *
 * Throws if used outside a `<DepsProvider>` — this is intentional so
 * that missing providers are caught immediately during development.
 */
export function useDeps(): Deps {
  const deps = useContext(DepsContext);

  if (!deps) {
    throw new Error(
      'useDeps() must be used inside a <DepsProvider>. ' +
        'Wrap your component tree with <DepsProvider> in App.tsx.',
    );
  }

  return deps;
}
