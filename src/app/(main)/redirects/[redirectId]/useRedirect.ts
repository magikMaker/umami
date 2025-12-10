import { useContext } from 'react';
import { RedirectContext, type RedirectData } from '../RedirectProvider';

/**
 * Hook to access redirect data from context.
 */
export function useRedirect(): RedirectData | null {
  return useContext(RedirectContext);
}
