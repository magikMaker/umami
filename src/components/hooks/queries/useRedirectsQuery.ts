import type { ReactQueryOptions } from '@/lib/types';
import { useApi } from '../useApi';
import { useModified } from '../useModified';
import { usePagedQuery } from '../usePagedQuery';

export function useRedirectsQuery({ teamId }: { teamId?: string }, options?: ReactQueryOptions) {
  const { modified } = useModified('redirects');
  const { get } = useApi();

  return usePagedQuery({
    queryKey: ['redirects', { teamId, modified }],
    queryFn: pageParams => {
      return get(teamId ? `/teams/${teamId}/redirects` : '/redirects', pageParams);
    },
    ...options,
  });
}
