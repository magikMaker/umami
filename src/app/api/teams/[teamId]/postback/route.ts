import { z } from 'zod';
import { getRandomChars } from '@/lib/generate';
import { parseRequest } from '@/lib/request';
import { badRequest, json, unauthorized } from '@/lib/response';
import { canCreateTeamWebsite, canViewTeam } from '@/permissions';
import { createEndpoint, findEndpointBySlug, getUserEndpoints } from '@/queries/prisma';

/**
 * Schema for creating a new postback endpoint.
 */
const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  websiteId: z.string().uuid(),
  slug: z.string().min(6).max(100).optional(),
  debugEnabled: z.boolean().optional().default(false),
  config: z.record(z.unknown()).optional().default({}),
});

/**
 * GET /api/teams/[teamId]/postback
 * Lists all postback endpoints for a team.
 */
export async function GET(request: Request, { params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const { auth, error } = await parseRequest(request);

  if (error) return error();

  if (!(await canViewTeam(auth, teamId))) {
    return unauthorized();
  }

  const endpoints = await getUserEndpoints(auth.user.id, { teamId });

  return json({ data: endpoints });
}

/**
 * POST /api/teams/[teamId]/postback
 * Creates a new postback endpoint for a team.
 */
export async function POST(request: Request, { params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const { body, auth, error } = await parseRequest(request, createSchema);

  if (error) return error();

  // Check permission - team member with website create permission
  if (!(await canCreateTeamWebsite(auth, teamId))) {
    return unauthorized();
  }

  // Generate slug if not provided
  const slug = body.slug || getRandomChars(12);

  // Check slug uniqueness
  const existing = await findEndpointBySlug(slug);
  if (existing) {
    return badRequest({ message: 'Slug already exists' });
  }

  // Create endpoint for team
  const endpoint = await createEndpoint({
    name: body.name,
    description: body.description,
    slug,
    debugEnabled: body.debugEnabled,
    config: body.config,
    website: { connect: { id: body.websiteId } },
    team: { connect: { id: teamId } },
  });

  return json(endpoint);
}
