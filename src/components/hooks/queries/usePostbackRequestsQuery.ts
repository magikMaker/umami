import { useApi } from '../useApi';

/**
 * Fetches postback requests for an endpoint with pagination.
 */
export function usePostbackRequestsQuery(
  endpointId: string,
  options?: {
    limit?: number;
    refetchInterval?: number | false;
  },
) {
  const { get, useQuery } = useApi();

  return useQuery({
    queryKey: ['postback-requests', endpointId, options?.limit],
    queryFn: () =>
      get(`/postbacks/${endpointId}/requests`, {
        limit: options?.limit || 100,
      }),
    refetchInterval: options?.refetchInterval,
    enabled: !!endpointId,
  });
}
