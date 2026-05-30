import { useQuery } from '@tanstack/react-query';
import { getHealth } from '@/api';
import { healthQueryKey } from '@/hooks/queryKeys';

export function useHealthQuery() {
  return useQuery({
    queryKey: healthQueryKey,
    queryFn: getHealth,
  });
}
