import { z } from 'zod';
import { uuid } from '@/lib/crypto';
import { getQueryFilters, parseRequest } from '@/lib/request';
import { badRequest, json } from '@/lib/response';
import { pagingParams, searchParams } from '@/lib/schema';
import {
  createRedirect,
  findRedirectBySlug,
  getTeamRedirects,
  getUserRedirects,
} from '@/queries/prisma';

/**
 * GET /api/redirects
 * Lists redirects for the current user or team.
 */
export async function GET(request: Request) {
  const schema = z.object({
    ...pagingParams,
    ...searchParams,
    teamId: z.string().uuid().optional(),
  });

  const { auth, query, error } = await parseRequest(request, schema);

  if (error) return error();

  const filters = await getQueryFilters(query);

  let redirects;
  if (query.teamId) {
    redirects = await getTeamRedirects(query.teamId, filters);
  } else {
    redirects = await getUserRedirects(auth.user.id, filters);
  }

  return json(redirects);
}

/**
 * Schema for creating a redirect.
 */
const createSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).optional(),
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
