import { parseRequest } from '@/lib/request';
import { json, notFound } from '@/lib/response';
import { findRedirect, findRedirectClicks } from '@/queries/prisma';

/**
 * Gets a redirect and checks ownership.
 */
async function getRedirect(redirectId: string, userId: string) {
  const redirect = await findRedirect({
    where: { id: redirectId },
  });

  if (!redirect || redirect.deletedAt) {
    return null;
  }

  // Check ownership (user or team)
  if (redirect.userId !== userId && !redirect.teamId) {
    return null;
  }

  return redirect;
}

/**
 * GET /api/redirects/[redirectId]/clicks
 * Gets clicks for a redirect.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ redirectId: string }> },
) {
  const { redirectId } = await params;
  const { auth, error } = await parseRequest(request);

  if (error) return error();

  const redirect = await getRedirect(redirectId, auth.user.id);

  if (!redirect) {
    return notFound();
  }

  const url = new URL(request.url);
  const limit = Number.parseInt(url.searchParams.get('limit') || '100', 10);
  const offset = Number.parseInt(url.searchParams.get('offset') || '0', 10);

  const { data, count } = await findRedirectClicks(redirectId, {
    limit,
    offset,
  });

  return json({ data, count, limit, offset });
}
