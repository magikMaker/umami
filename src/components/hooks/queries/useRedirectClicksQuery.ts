import { useApi } from '../useApi';

/**
 * Fetches clicks for a redirect.
 */
export function useRedirectClicksQuery(
  redirectId: string,
  options?: {
    limit?: number;
    refetchInterval?: number | false;
  },
) {
  const { get, useQuery } = useApi();

  return useQuery({
    queryKey: ['redirect-clicks', redirectId, options?.limit],
    queryFn: () =>
      get(`/redirects/${redirectId}/clicks`, {
        limit: options?.limit || 100,
      }),
    refetchInterval: options?.refetchInterval,
    enabled: !!redirectId,
  });
}
