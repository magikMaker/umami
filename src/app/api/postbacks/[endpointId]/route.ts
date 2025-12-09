import { z } from 'zod';
import { parseRequest } from '@/lib/request';
import { badRequest, json, notFound } from '@/lib/response';
import { deleteEndpoint, findEndpoint, findEndpointBySlug, updateEndpoint } from '@/queries/prisma';

/**
 * Schema for updating a postback endpoint.
 */
const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  slug: z.string().min(6).max(100).optional(),
  receiveTemplateId: z.string().max(50).nullable().optional(),
  relayTemplateId: z.string().max(50).nullable().optional(),
  relayTargetUrl: z.string().url().max(2000).nullable().optional(),
  isActive: z.boolean().optional(),
  config: z.record(z.unknown()).optional(),
});

/**
 * Gets an endpoint and checks ownership.
 */
async function getEndpoint(endpointId: string, userId: string) {
  const endpoint = await findEndpoint({
    where: { id: endpointId },
    include: {
      website: { select: { id: true, name: true } },
      relays: true,
      _count: { select: { requests: true } },
    },
  });

  if (!endpoint || endpoint.deletedAt) {
    return null;
  }

  // Check ownership (user or team)
  if (endpoint.userId !== userId && !endpoint.teamId) {
    return null;
  }

  return endpoint;
}

/**
 * GET /api/postbacks/[endpointId]
 * Gets details for a specific postback endpoint.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ endpointId: string }> },
) {
  const { endpointId } = await params;
  const { auth, error } = await parseRequest(request);

  if (error) return error();

  const endpoint = await getEndpoint(endpointId, auth.user.id);

  if (!endpoint) {
    return notFound();
  }

  return json(endpoint);
}

/**
 * POST /api/postbacks/[endpointId]
 * Updates a postback endpoint.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ endpointId: string }> },
) {
  const { endpointId } = await params;
  const { body, auth, error } = await parseRequest(request, updateSchema);

  if (error) return error();

  const endpoint = await getEndpoint(endpointId, auth.user.id);

  if (!endpoint) {
    return notFound();
  }

  // Check slug uniqueness if changing
  if (body.slug && body.slug !== endpoint.slug) {
    const existing = await findEndpointBySlug(body.slug);
    if (existing) {
      return badRequest({ message: 'Slug already exists' });
    }
  }

  const updated = await updateEndpoint(endpointId, body);

  return json(updated);
}

/**
 * DELETE /api/postbacks/[endpointId]
 * Soft deletes a postback endpoint.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ endpointId: string }> },
) {
  const { endpointId } = await params;
  const { auth, error } = await parseRequest(request);

  if (error) return error();

  const endpoint = await getEndpoint(endpointId, auth.user.id);

  if (!endpoint) {
    return notFound();
  }

  await deleteEndpoint(endpointId);

  return json({ ok: true });
}
