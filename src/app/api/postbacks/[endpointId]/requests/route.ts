import { z } from 'zod';
import { parseRequest } from '@/lib/request';
import { forbidden, json, notFound } from '@/lib/response';
import { findEndpoint, findPostbackRequests } from '@/queries/prisma';

/**
 * Schema for query parameters.
 */
const querySchema = z.object({
  limit: z.coerce.number().min(1).max(500).default(100),
  offset: z.coerce.number().min(0).default(0),
});

/**
 * GET /api/postbacks/[endpointId]/requests
 * Gets the list of postback requests for an endpoint.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ endpointId: string }> },
) {
  const { endpointId } = await params;
  const { query, auth, error } = await parseRequest(request, querySchema);

  if (error) return error();

  // Check ownership
  const endpoint = await findEndpoint({ where: { id: endpointId } });

  if (!endpoint || endpoint.deletedAt) {
    return notFound();
  }

  if (endpoint.userId !== auth.user.id && !endpoint.teamId) {
    return forbidden();
  }

  const requests = await findPostbackRequests(endpointId, {
    limit: query.limit,
    offset: query.offset,
  });

  return json({ data: requests });
}
