import { z } from 'zod';
import { uuid } from '@/lib/crypto';
import { parseRequest } from '@/lib/request';
import { badRequest, json } from '@/lib/response';
import {
  createRedirect,
  findRedirectBySlug,
  findRedirectsByTeamId,
  findRedirectsByUserId,
} from '@/queries/prisma';

/**
 * Schema for creating a redirect.
 */
const createSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(6).max(100).optional(),
  targetUrl: z.string().url().max(2000),
  description: z.string().max(500).optional(),
  websiteId: z.string().uuid(),
  teamId: z.string().uuid().optional(),
  endpointId: z.string().uuid().optional(),
  paramConfig: z
    .object({
      capture: z.array(z.string()).optional(),
      passThrough: z.array(z.string()).optional(),
      mappings: z.record(z.string()).optional(),
      clickIdParam: z.string().optional(),
    })
    .optional(),
});

/**
 * GET /api/redirects
 * Lists redirects for the current user or team.
 */
export async function GET(request: Request) {
  const { auth, error } = await parseRequest(request);

  if (error) return error();

  const url = new URL(request.url);
  const teamId = url.searchParams.get('teamId');

  let redirects;
  if (teamId) {
    redirects = await findRedirectsByTeamId(teamId);
  } else {
    redirects = await findRedirectsByUserId(auth.user.id);
  }

  return json(redirects);
}

/**
 * POST /api/redirects
 * Creates a new redirect.
 */
export async function POST(request: Request) {
  const { body, auth, error } = await parseRequest(request, createSchema);

  if (error) return error();

  // Generate slug if not provided (use short random string for URL-friendly slugs)
  const slug = body.slug || uuid().split('-')[0];

  // Check slug uniqueness
  const existing = await findRedirectBySlug(slug);
  if (existing) {
    return badRequest({ message: 'Slug already exists' });
  }

  const redirect = await createRedirect({
    id: uuid(),
    name: body.name,
    slug,
    targetUrl: body.targetUrl,
    description: body.description,
    websiteId: body.websiteId,
    userId: body.teamId ? undefined : auth.user.id,
    teamId: body.teamId,
    endpointId: body.endpointId,
    paramConfig: body.paramConfig,
  });

  return json(redirect);
}
