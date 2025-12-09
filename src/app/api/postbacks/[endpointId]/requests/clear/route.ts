import prisma from '@/lib/prisma';
import { parseRequest } from '@/lib/request';
import { forbidden, json, notFound } from '@/lib/response';
import { findEndpoint } from '@/queries/prisma';

/**
 * POST /api/postbacks/[endpointId]/requests/clear
 * Clears all postback requests for an endpoint.
 */
export async function POST(
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

  await prisma.client.postbackRequest.deleteMany({
    where: { endpointId },
  });

  return json({ ok: true });
}
