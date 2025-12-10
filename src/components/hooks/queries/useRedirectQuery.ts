import { useApi } from '../useApi';

/**
 * Fetches a single redirect by ID.
 */
export function useRedirectQuery(redirectId: string) {
  const { get, useQuery } = useApi();

  return useQuery({
    queryKey: ['redirect', redirectId],
    queryFn: () => get(`/redirects/${redirectId}`),
    enabled: !!redirectId,
  });
}
