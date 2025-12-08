'use client';
import { Loading } from '@umami/react-zen';
import { createContext, type ReactNode } from 'react';
import { usePostbackQuery } from '@/components/hooks/queries/usePostbackQuery';

/**
 * Postback endpoint type for context.
 */
export interface Postback {
  id: string;
  name: string;
  slug: string;
  description?: string;
  debugEnabled: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const PostbackContext = createContext<Postback | null>(null);

/**
 * Provides postback endpoint context to child components.
 */
export function PostbackProvider({
  postbackId,
  children,
}: {
  postbackId?: string;
  children: ReactNode;
}) {
  const { data: postback, isLoading, isFetching } = usePostbackQuery(postbackId);

  if (isFetching && isLoading) {
    return <Loading placement="absolute" />;
  }

  if (!postback) {
    return null;
  }

  return <PostbackContext.Provider value={postback}>{children}</PostbackContext.Provider>;
}
