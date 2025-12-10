/**
 * Prisma queries for Redirect module.
 * Handles CRUD operations for redirects and redirect clicks.
 */
import type { Prisma, Redirect, RedirectClick } from '@/generated/prisma';
import prisma from '@/lib/prisma';
import type { QueryFilters } from '@/lib/types';

/**
 * Gets redirects with pagination and search support.
 */
export async function getRedirects(
  criteria: Prisma.RedirectFindManyArgs,
  filters: QueryFilters = {},
) {
  const { search } = filters;
  const { getSearchParameters, pagedQuery } = prisma;

  const where: Prisma.RedirectWhereInput = {
    ...criteria.where,
    deletedAt: null,
    ...getSearchParameters(search, [
      { name: 'contains' },
      { slug: 'contains' },
      { targetUrl: 'contains' },
    ]),
  };

  return pagedQuery('redirect', { ...criteria, where }, filters);
}

/**
 * Gets redirects for a user.
 */
export async function getUserRedirects(userId: string, filters?: QueryFilters) {
  return getRedirects(
    {
      where: {
        userId,
      },
      orderBy: { createdAt: 'desc' },
    },
    filters,
  );
}

/**
 * Gets redirects for a team.
 */
export async function getTeamRedirects(teamId: string, filters?: QueryFilters) {
  return getRedirects(
    {
      where: {
        teamId,
      },
      orderBy: { createdAt: 'desc' },
    },
    filters,
  );
}

/**
 * Creates a new redirect.
 */
export async function createRedirect(data: Prisma.RedirectUncheckedCreateInput): Promise<Redirect> {
  return prisma.client.redirect.create({ data });
}

/**
 * Finds a redirect by ID.
 */
export async function findRedirect(
  criteria: Prisma.RedirectFindFirstArgs,
): Promise<Redirect | null> {
  return prisma.client.redirect.findFirst(criteria);
}

/**
 * Finds a redirect by slug.
 */
export async function findRedirectBySlug(slug: string): Promise<Redirect | null> {
  return prisma.client.redirect.findFirst({
    where: { slug, deletedAt: null },
  });
}

/**
 * Gets a redirect by ID.
 */
export async function getRedirect(redirectId: string): Promise<Redirect | null> {
  return prisma.client.redirect.findUnique({
    where: { id: redirectId },
  });
}

/**
 * Updates a redirect.
 */
export async function updateRedirect(
  redirectId: string,
  data: Prisma.RedirectUpdateInput,
): Promise<Redirect> {
  return prisma.client.redirect.update({
    where: { id: redirectId },
    data,
  });
}

/**
 * Soft deletes a redirect.
 */
export async function deleteRedirect(redirectId: string): Promise<Redirect> {
  return prisma.client.redirect.update({
    where: { id: redirectId },
    data: { deletedAt: new Date() },
  });
}

/**
 * Creates a redirect click record.
 */
export async function createRedirectClick(
  data: Prisma.RedirectClickCreateInput,
): Promise<RedirectClick> {
  return prisma.client.redirectClick.create({ data });
}

/**
 * Finds a redirect click by click token.
 */
export async function findRedirectClickByToken(
  clickToken: string,
): Promise<(RedirectClick & { redirect: Redirect }) | null> {
  return prisma.client.redirectClick.findFirst({
    where: { clickToken },
    include: { redirect: true },
  });
}

/**
 * Finds a redirect click by external click ID.
 */
export async function findRedirectClickByExternalId(
  externalClickId: string,
): Promise<(RedirectClick & { redirect: Redirect }) | null> {
  return prisma.client.redirectClick.findFirst({
    where: { externalClickId },
    include: { redirect: true },
  });
}

/**
 * Finds redirect clicks by various ad network IDs.
 */
export async function findRedirectClickByAdNetworkId(params: {
  gclid?: string;
  fbclid?: string;
  msclkid?: string;
  ttclid?: string;
  twclid?: string;
}): Promise<(RedirectClick & { redirect: Redirect }) | null> {
  const { gclid, fbclid, msclkid, ttclid, twclid } = params;

  // Build OR conditions for the provided IDs
  const orConditions: Prisma.RedirectClickWhereInput[] = [];
  if (gclid) orConditions.push({ gclid });
  if (fbclid) orConditions.push({ fbclid });
  if (msclkid) orConditions.push({ msclkid });
  if (ttclid) orConditions.push({ ttclid });
  if (twclid) orConditions.push({ twclid });

  if (orConditions.length === 0) return null;

  return prisma.client.redirectClick.findFirst({
    where: { OR: orConditions },
    include: { redirect: true },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Finds redirect clicks for a redirect.
 */
export async function findRedirectClicks(
  redirectId: string,
  options?: { limit?: number; offset?: number },
): Promise<{ data: RedirectClick[]; count: number }> {
  const [data, count] = await Promise.all([
    prisma.client.redirectClick.findMany({
      where: { redirectId },
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 100,
      skip: options?.offset || 0,
    }),
    prisma.client.redirectClick.count({
      where: { redirectId },
    }),
  ]);

  return { data, count };
}

/**
 * Updates a redirect click (e.g., to mark conversion).
 */
export async function updateRedirectClick(
  clickId: string,
  data: Prisma.RedirectClickUpdateInput,
): Promise<RedirectClick> {
  return prisma.client.redirectClick.update({
    where: { id: clickId },
    data,
  });
}

/**
 * Gets redirect statistics.
 */
export async function getRedirectStats(
  redirectId: string,
  startDate?: Date,
  endDate?: Date,
): Promise<{
  totalClicks: number;
  conversions: number;
  conversionRate: number;
}> {
  const where: Prisma.RedirectClickWhereInput = {
    redirectId,
    ...(startDate && { createdAt: { gte: startDate } }),
    ...(endDate && { createdAt: { lte: endDate } }),
  };

  const [totalClicks, conversions] = await Promise.all([
    prisma.client.redirectClick.count({ where }),
    prisma.client.redirectClick.count({
      where: { ...where, convertedAt: { not: null } },
    }),
  ]);

  return {
    totalClicks,
    conversions,
    conversionRate: totalClicks > 0 ? conversions / totalClicks : 0,
  };
}
