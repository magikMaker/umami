import { useApi } from '../useApi';
import { useModified } from '../useModified';

/**
 * Query hook for fetching a single relay by ID.
 */
export function useRelayQuery(endpointId: string, relayId?: string) {
  const { get, useQuery } = useApi();
  const { modified } = useModified(`relay:${relayId}`);

  return useQuery({
    queryKey: ['relay', { endpointId, relayId, modified }],
    queryFn: () => {
      return get(`/postbacks/${endpointId}/relays/${relayId}`);
    },
    enabled: !!endpointId && !!relayId,
  });
}
