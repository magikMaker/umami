import { useContext } from 'react';
import { PostbackContext } from '@/app/(main)/postbacks/PostbackProvider';

/**
 * Hook to access the current postback endpoint from context.
 */
export function usePostback() {
  return useContext(PostbackContext);
}
