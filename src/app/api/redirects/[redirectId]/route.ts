import { z } from 'zod';
import { parseRequest } from '@/lib/request';
import { badRequest, json, notFound } from '@/lib/response';
import {
  deleteRedirect,
  findRedirect,
  findRedirectBySlug,
  getRedirectStats,
  updateRedirect,
} from '@/queries/prisma';

/**
 * Schema for updating a redirect.
 */
const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z.string().min(6).max(100).optional(),
  targetUrl: z.string().url().max(2000).optional(),
  description: z.string().max(500).optional().nullable(),
  endpointId: z.string().uuid().optional().nullable(),
  paramConfig: z
    .object({
      capture: z.array(z.string()).optional(),
      passThrough: z.array(z.string()).optional(),
      mappings: z.record(z.string()).optional(),
      clickIdParam: z.string().optional(),
    })
    .optional()
    .nullable(),
  isActive: z.boolean().optional(),
});

/**
 * Gets a redirect and checks ownership.
 */
async function getRedirect(redirectId: string, userId: string) {
  const redirect = await findRedirect({
    where: { id: redirectId },
    include: {
      _count: { select: { clicks: true } },
    },
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
 * GET /api/redirects/[redirectId]
 * Gets details for a specific redirect.
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

  // Get stats
  const stats = await getRedirectStats(redirectId);

  return json({ ...redirect, stats });
}

/**
 * POST /api/redirects/[redirectId]
 * Updates a redirect.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ redirectId: string }> },
) {
  const { redirectId } = await params;
  const { body, auth, error } = await parseRequest(request, updateSchema);

  if (error) return error();

  const redirect = await getRedirect(redirectId, auth.user.id);

  if (!redirect) {
    return notFound();
  }

  // Check slug uniqueness if changing
  if (body.slug && body.slug !== redirect.slug) {
    const existing = await findRedirectBySlug(body.slug);
    if (existing) {
      return badRequest({ message: 'Slug already exists' });
    }
  }

  const updated = await updateRedirect(redirectId, body);

  return json(updated);
}

/**
 * DELETE /api/redirects/[redirectId]
 * Soft deletes a redirect.
 */
export async function DELETE(
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

  await deleteRedirect(redirectId);

  return json({ ok: true });
}
