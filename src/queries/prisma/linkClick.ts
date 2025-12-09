import type { Prisma } from '@/generated/prisma/client';
import { ulid } from '@/lib/crypto';
import prisma from '@/lib/prisma';

/**
 * Creates a new link click record.
 */
export async function createLinkClick(data: Omit<Prisma.LinkClickCreateInput, 'id'>) {
  return prisma.client.linkClick.create({
    data: {
      id: ulid(),
      ...data,
    },
  });
}

/**
 * Finds a link click by its click ID value.
 */
export async function findLinkClickByClickId(clickId: string) {
  return prisma.client.linkClick.findUnique({
    where: { clickId },
    include: {
      link: {
        select: {
          id: true,
          name: true,
          url: true,
          slug: true,
          endpointId: true,
        },
      },
    },
  });
}

/**
 * Finds link clicks for a specific link.
 */
export async function findLinkClicks(
  linkId: string,
  options?: {
    limit?: number;
    offset?: number;
    startDate?: Date;
    endDate?: Date;
  },
) {
  const where: Prisma.LinkClickWhereInput = { linkId };

  if (options?.startDate || options?.endDate) {
    where.createdAt = {};
    if (options.startDate) {
      where.createdAt.gte = options.startDate;
    }
    if (options.endDate) {
      where.createdAt.lte = options.endDate;
    }
  }

  return prisma.client.linkClick.findMany({
    where,
    take: options?.limit || 100,
    skip: options?.offset || 0,
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Marks a click as converted.
 */
export async function markClickConverted(clickId: string) {
  return prisma.client.linkClick.update({
    where: { clickId },
    data: { convertedAt: new Date() },
  });
}

/**
 * Gets click statistics for a link.
 */
export async function getLinkClickStats(linkId: string, startDate: Date, endDate: Date) {
  const [total, converted] = await Promise.all([
    prisma.client.linkClick.count({
      where: {
        linkId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    }),
    prisma.client.linkClick.count({
      where: {
        linkId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        convertedAt: { not: null },
      },
    }),
  ]);

  return {
    total,
    converted,
    conversionRate: total > 0 ? (converted / total) * 100 : 0,
  };
}
