import type { Prisma } from '@/generated/prisma/client';
import { uuid } from '@/lib/crypto';
import prisma from '@/lib/prisma';

/**
 * Creates a new postback relay.
 */
export async function createRelay(data: Omit<Prisma.PostbackRelayCreateInput, 'id'>) {
  return prisma.client.postbackRelay.create({
    data: {
      id: uuid(),
      ...data,
    },
  });
}

/**
 * Finds a single postback relay by ID.
 */
export async function findRelay(relayId: string) {
  return prisma.client.postbackRelay.findUnique({
    where: { id: relayId },
  });
}

/**
 * Finds all relays for an endpoint.
 */
export async function findEndpointRelays(endpointId: string) {
  return prisma.client.postbackRelay.findMany({
    where: { endpointId },
    orderBy: { createdAt: 'asc' },
  });
}

/**
 * Finds only active relays for an endpoint.
 */
export async function findActiveRelays(endpointId: string) {
  return prisma.client.postbackRelay.findMany({
    where: {
      endpointId,
      isActive: true,
    },
    orderBy: { createdAt: 'asc' },
  });
}

/**
 * Updates a postback relay.
 */
export async function updateRelay(relayId: string, data: Prisma.PostbackRelayUpdateInput) {
  return prisma.client.postbackRelay.update({
    where: { id: relayId },
    data,
  });
}

/**
 * Deletes a postback relay.
 */
export async function deleteRelay(relayId: string) {
  return prisma.client.postbackRelay.delete({
    where: { id: relayId },
  });
}

/**
 * Creates a new relay log entry.
 */
export async function createRelayLog(data: Omit<Prisma.PostbackRelayLogCreateInput, 'id'>) {
  return prisma.client.postbackRelayLog.create({
    data: {
      id: uuid(),
      ...data,
    },
  });
}

/**
 * Finds relay logs with optional limit.
 */
export async function findRelayLogs(relayId: string, options?: { limit?: number }) {
  return prisma.client.postbackRelayLog.findMany({
    where: { relayId },
    take: options?.limit || 50,
    orderBy: { createdAt: 'desc' },
  });
}
