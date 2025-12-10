'use client';
import { Loading } from '@umami/react-zen';
import { createContext, type ReactNode } from 'react';
import { useRedirectQuery } from '@/components/hooks/queries/useRedirectQuery';

/**
 * Redirect data structure from the API.
 */
export interface RedirectData {
  id: string;
  name: string;
  slug: string;
  targetUrl: string;
  description: string | null;
  websiteId: string;
  userId: string | null;
  teamId: string | null;
  endpointId: string | null;
  paramConfig: {
    capture?: string[];
    passThrough?: string[];
    mappings?: Record<string, string>;
    clickIdParam?: string;
  } | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
  stats?: {
    totalClicks: number;
    conversions: number;
    conversionRate: number;
  };
}

/**
 * Context for redirect data.
 */
export const RedirectContext = createContext<RedirectData | null>(null);

/**
 * Provider that loads redirect data and makes it available via context.
 */
export function RedirectProvider({
  redirectId,
  children,
}: {
  redirectId: string;
  children: ReactNode;
}) {
  const { data, isLoading } = useRedirectQuery(redirectId);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <RedirectContext.Provider value={data as RedirectData}>{children}</RedirectContext.Provider>
  );
}
