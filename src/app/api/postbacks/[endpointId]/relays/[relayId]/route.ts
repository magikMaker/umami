import { z } from 'zod';
import { parseRequest } from '@/lib/request';
import { json, notFound } from '@/lib/response';
import { deleteRelay, findEndpoint, findRelay, updateRelay } from '@/queries/prisma';

/**
 * Schema for updating a relay.
 */
const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  targetUrl: z.string().url().optional(),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).optional(),
  format: z.enum(['json', 'query', 'form']).optional(),
  mapping: z.record(z.unknown()).optional(),
  headers: z.record(z.string()).optional(),
  conditions: z.record(z.unknown()).optional(),
  retryConfig: z
    .object({
      maxAttempts: z.number().min(1).max(10),
      initialDelayMs: z.number().min(100).max(60000),
      maxDelayMs: z.number().min(1000).max(300000),
      backoffMultiplier: z.number().min(1).max(10),
    })
    .optional(),
  isActive: z.boolean().optional(),
});

/**
 * Checks endpoint ownership and returns endpoint.
 */
async function checkAccess(endpointId: string, userId: string) {
  const endpoint = await findEndpoint({ where: { id: endpointId } });

  if (!endpoint || endpoint.deletedAt) {
    return null;
  }

  if (endpoint.userId !== userId && !endpoint.teamId) {
    return null;
  }

  return endpoint;
}

/**
 * GET /api/postbacks/[endpointId]/relays/[relayId]
 * Gets details for a specific relay.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ endpointId: string; relayId: string }> },
) {
  const { endpointId, relayId } = await params;
  const { auth, error } = await parseRequest(request);

  if (error) return error();

  const endpoint = await checkAccess(endpointId, auth.user.id);
  if (!endpoint) {
    return notFound();
  }

  const relay = await findRelay(relayId);

  if (!relay || relay.endpointId !== endpointId) {
    return notFound();
  }

  return json(relay);
}

/**
 * POST /api/postbacks/[endpointId]/relays/[relayId]
 * Updates a relay.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ endpointId: string; relayId: string }> },
) {
  const { endpointId, relayId } = await params;
  const { body, auth, error } = await parseRequest(request, updateSchema);

  if (error) return error();

  const endpoint = await checkAccess(endpointId, auth.user.id);
  if (!endpoint) {
    return notFound();
  }

  const relay = await findRelay(relayId);

  if (!relay || relay.endpointId !== endpointId) {
    return notFound();
  }

  const updated = await updateRelay(relayId, body);

  return json(updated);
}

/**
 * DELETE /api/postbacks/[endpointId]/relays/[relayId]
 * Deletes a relay.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ endpointId: string; relayId: string }> },
) {
  const { endpointId, relayId } = await params;
  const { auth, error } = await parseRequest(request);

  if (error) return error();

  const endpoint = await checkAccess(endpointId, auth.user.id);
  if (!endpoint) {
    return notFound();
  }

  const relay = await findRelay(relayId);

  if (!relay || relay.endpointId !== endpointId) {
    return notFound();
  }

  await deleteRelay(relayId);

  return json({ ok: true });
}
