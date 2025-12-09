import type { Prisma } from '@/generated/prisma/client';
import { uuid } from '@/lib/crypto';
import prisma from '@/lib/prisma';

/**
 * Creates a new postback request record.
 */
export async function createPostbackRequest(data: Omit<Prisma.PostbackRequestCreateInput, 'id'>) {
  return prisma.client.postbackRequest.create({
    data: {
      id: uuid(),
      ...data,
    },
  });
}

/**
 * Finds postback requests for an endpoint with pagination and date
 * filtering.
 */
export async function findPostbackRequests(
  endpointId: string,
  options?: {
    limit?: number;
    offset?: number;
    startDate?: Date;
    endDate?: Date;
  },
) {
  const where: Prisma.PostbackRequestWhereInput = {
    endpointId,
  };

  if (options?.startDate || options?.endDate) {
    where.createdAt = {};
    if (options.startDate) {
      where.createdAt.gte = options.startDate;
    }
    if (options.endDate) {
      where.createdAt.lte = options.endDate;
    }
  }

  return prisma.client.postbackRequest.findMany({
    where,
    take: options?.limit || 100,
    skip: options?.offset || 0,
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Finds a single postback request by ID with endpoint details.
 */
export async function findPostbackRequest(requestId: string) {
  return prisma.client.postbackRequest.findUnique({
    where: { id: requestId },
    include: {
      endpoint: {
        select: { id: true, name: true, slug: true },
      },
    },
  });
}

/**
 * Updates a postback request.
 */
export async function updatePostbackRequest(
  requestId: string,
  data: Prisma.PostbackRequestUpdateInput,
) {
  return prisma.client.postbackRequest.update({
    where: { id: requestId },
    data,
  });
}

/**
 * Deletes old postback requests for an endpoint.
 */
export async function deleteOldRequests(endpointId: string, olderThan: Date) {
  return prisma.client.postbackRequest.deleteMany({
    where: {
      endpointId,
      createdAt: { lt: olderThan },
    },
  });
}

/**
 * Gets aggregated statistics for postback requests by status.
 */
export async function getRequestStats(endpointId: string, startDate: Date, endDate: Date) {
  return prisma.client.postbackRequest.groupBy({
    by: ['status'],
    where: {
      endpointId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    _count: true,
  });
}
