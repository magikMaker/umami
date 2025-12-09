import { parseRequest } from '@/lib/request';
import { forbidden, json, notFound } from '@/lib/response';
import { findEndpoint, findPostbackRequest } from '@/queries/prisma';

/**
 * GET /api/postbacks/[endpointId]/requests/[requestId]
 * Gets a single postback request by ID.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ endpointId: string; requestId: string }> },
) {
  const { endpointId, requestId } = await params;
  const { auth, error } = await parseRequest(request);

  if (error) return error();

  const endpoint = await findEndpoint({ where: { id: endpointId } });

  if (!endpoint || endpoint.deletedAt) {
    return notFound();
  }

  if (endpoint.userId !== auth.user.id && !endpoint.teamId) {
    return forbidden();
  }

  const requestRecord = await findPostbackRequest(requestId);

  if (!requestRecord || requestRecord.endpointId !== endpointId) {
    return notFound();
  }

  return json(requestRecord);
}
