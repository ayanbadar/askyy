import { useCallback, useEffect, useRef, useState } from 'react';
import type { AsyncState } from '@/types';

interface UseAsyncOptions {
  immediate?: boolean;
}

export function useAsync<T>(
  asyncFn: () => Promise<T>,
  deps: React.DependencyList = [],
  options: UseAsyncOptions = { immediate: true },
) {
  const [state, setState] = useState<AsyncState<T>>({ status: 'idle' });
  const asyncFnRef = useRef(asyncFn);

  asyncFnRef.current = asyncFn;

  const execute = useCallback(async () => {
    setState({ status: 'loading' });

    try {
      const data = await asyncFnRef.current();
      setState({ status: 'success', data });
      return data;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Something went wrong';
      setState({ status: 'error', error: message });
      throw error;
    }
  }, []);

  useEffect(() => {
    if (options.immediate) {
      void execute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [execute, options.immediate, ...deps]);

  return { ...state, execute, refetch: execute };
}
