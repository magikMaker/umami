import type { Prisma } from '@/generated/prisma/client';
import { uuid } from '@/lib/crypto';
import prisma from '@/lib/prisma';

/**
 * Creates a new postback endpoint.
 */
export async function createEndpoint(data: Prisma.PostbackEndpointCreateInput) {
  return prisma.client.postbackEndpoint.create({
    data: {
      id: uuid(),
      ...data,
    },
  });
}

/**
 * Finds a single postback endpoint.
 */
export async function findEndpoint(criteria: Prisma.PostbackEndpointFindUniqueArgs) {
  return prisma.client.postbackEndpoint.findUnique(criteria);
}

/**
 * Finds a postback endpoint by slug with related data.
 */
export async function findEndpointBySlug(slug: string) {
  return prisma.client.postbackEndpoint.findUnique({
    where: { slug },
    include: {
      website: true,
      relays: {
        where: { isActive: true },
      },
    },
  });
}

/**
 * Finds multiple postback endpoints.
 */
export async function findEndpoints(criteria: Prisma.PostbackEndpointFindManyArgs) {
  return prisma.client.postbackEndpoint.findMany(criteria);
}

/**
 * Gets all endpoints for a user, optionally filtered by team.
 */
export async function getUserEndpoints(userId: string, options?: { teamId?: string }) {
  const where: Prisma.PostbackEndpointWhereInput = {
    deletedAt: null,
  };

  if (options?.teamId) {
    where.teamId = options.teamId;
  } else {
    where.userId = userId;
    where.teamId = null;
  }

  return prisma.client.postbackEndpoint.findMany({
    where,
    include: {
      website: {
        select: { id: true, name: true },
      },
      _count: {
        select: { requests: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Updates a postback endpoint.
 */
export async function updateEndpoint(endpointId: string, data: Prisma.PostbackEndpointUpdateInput) {
  return prisma.client.postbackEndpoint.update({
    where: { id: endpointId },
    data,
  });
}

/**
 * Soft deletes a postback endpoint by setting deletedAt.
 */
export async function deleteEndpoint(endpointId: string) {
  return prisma.client.postbackEndpoint.update({
    where: { id: endpointId },
    data: { deletedAt: new Date() },
  });
}
