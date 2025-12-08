import type { ReactQueryOptions } from '@/lib/types';
import { useApi } from '../useApi';
import { useModified } from '../useModified';
import { usePagedQuery } from '../usePagedQuery';

/**
 * Fetches the list of postback endpoints for the current user or team.
 */
export function usePostbacksQuery({ teamId }: { teamId?: string }, options?: ReactQueryOptions) {
  const { modified } = useModified('postbacks');
  const { get } = useApi();

  return usePagedQuery({
    queryKey: ['postbacks', { teamId, modified }],
    queryFn: pageParams => {
      return get(teamId ? `/teams/${teamId}/postbacks` : '/postbacks', pageParams);
    },
    ...options,
  });
}
