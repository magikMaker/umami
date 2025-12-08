import { useApi } from '../useApi';
import { useModified } from '../useModified';

/**
 * Fetches a single postback endpoint by ID.
 */
export function usePostbackQuery(postbackId?: string) {
  const { get, useQuery } = useApi();
  const { modified } = useModified(`postback:${postbackId}`);

  return useQuery({
    queryKey: ['postback', { postbackId, modified }],
    queryFn: () => {
      return get(`/postbacks/${postbackId}`);
    },
    enabled: !!postbackId,
  });
}
