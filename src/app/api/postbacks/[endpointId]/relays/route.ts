import { z } from 'zod';
import { parseRequest } from '@/lib/request';
import { forbidden, json, notFound } from '@/lib/response';
import { createRelay, findEndpoint, findEndpointRelays } from '@/queries/prisma';

/**
 * Schema for creating a relay.
 */
const createSchema = z.object({
  name: z.string().min(1).max(100),
  targetUrl: z.string().url(),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).default('POST'),
  format: z.enum(['json', 'query', 'form']).default('json'),
  mapping: z.record(z.unknown()).optional().default({}),
  headers: z.record(z.string()).optional(),
  conditions: z.record(z.unknown()).optional(),
  retryConfig: z
    .object({
      maxAttempts: z.number().min(1).max(10).default(3),
      initialDelayMs: z.number().min(100).max(60000).default(1000),
      maxDelayMs: z.number().min(1000).max(300000).default(30000),
      backoffMultiplier: z.number().min(1).max(10).default(2),
    })
    .optional(),
  isActive: z.boolean().default(true),
});

/**
 * GET /api/postbacks/[endpointId]/relays
 * Gets all relays for a postback endpoint.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ endpointId: string }> },
) {
  const { endpointId } = await params;
  const { auth, error } = await parseRequest(request);

  if (error) return error();

  const endpoint = await findEndpoint({ where: { id: endpointId } });

  if (!endpoint || endpoint.deletedAt) {
    return notFound();
  }

  if (endpoint.userId !== auth.user.id && !endpoint.teamId) {
    return forbidden();
  }

  const relays = await findEndpointRelays(endpointId);

  return json({ data: relays });
}

/**
 * POST /api/postbacks/[endpointId]/relays
 * Creates a new relay for a postback endpoint.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ endpointId: string }> },
) {
  const { endpointId } = await params;
  const { body, auth, error } = await parseRequest(request, createSchema);

  if (error) return error();

  const endpoint = await findEndpoint({ where: { id: endpointId } });

  if (!endpoint || endpoint.deletedAt) {
    return notFound();
  }

  if (endpoint.userId !== auth.user.id && !endpoint.teamId) {
    return forbidden();
  }

  const relay = await createRelay({
    endpoint: { connect: { id: endpointId } },
    ...body,
  });

  return json(relay);
}
