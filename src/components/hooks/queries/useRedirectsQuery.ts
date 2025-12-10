import { useApi } from '../useApi';

/**
 * Fetches redirects for the current user or team.
 */
export function useRedirectsQuery(teamId?: string) {
  const { get, useQuery } = useApi();

  return useQuery({
    queryKey: ['redirects', teamId],
    queryFn: () => get('/redirects', teamId ? { teamId } : undefined),
  });
}
