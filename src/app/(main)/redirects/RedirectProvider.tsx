'use client';
import { Loading } from '@umami/react-zen';
import { createContext, type ReactNode } from 'react';
import { useRedirectQuery } from '@/components/hooks/queries/useRedirectQuery';
import type { Redirect } from '@/generated/prisma/client';

export type RedirectData = Redirect | null;

export const RedirectContext = createContext<RedirectData>(null);

export function RedirectProvider({
  redirectId,
  children,
}: {
  redirectId?: string;
  children: ReactNode;
}) {
  const { data: redirect, isLoading, isFetching } = useRedirectQuery(redirectId);

  if (isFetching && isLoading) {
    return <Loading placement="absolute" />;
  }

  if (!redirect) {
    return null;
  }

  return <RedirectContext.Provider value={redirect}>{children}</RedirectContext.Provider>;
}
