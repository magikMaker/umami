import type { ReactQueryOptions } from '@/lib/types';
import { useApi } from '../useApi';
import { useModified } from '../useModified';

/**
 * Query hook for fetching all relays for an endpoint.
 */
export function useRelaysQuery(endpointId: string, options?: ReactQueryOptions) {
  const { get, useQuery } = useApi();
  const { modified } = useModified(`relays:${endpointId}`);

  return useQuery({
    queryKey: ['relays', { endpointId, modified }],
    queryFn: () => {
      return get(`/postbacks/${endpointId}/relays`);
    },
    enabled: !!endpointId,
    ...options,
  });
}
