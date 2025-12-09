import { z } from 'zod';
import { getRandomChars } from '@/lib/generate';
import { parseRequest } from '@/lib/request';
import { badRequest, json } from '@/lib/response';
import { createEndpoint, findEndpointBySlug, getUserEndpoints } from '@/queries/prisma';

/**
 * Schema for creating a new postback endpoint.
 */
const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  websiteId: z.string().uuid(),
  slug: z.string().min(6).max(100).optional(),
  receiveTemplateId: z.string().max(50).optional(),
  relayTemplateId: z.string().max(50).optional(),
  relayTargetUrl: z.string().url().max(2000).optional(),
  config: z.record(z.unknown()).optional().default({}),
});

/**
 * GET /api/postbacks
 * Lists all postback endpoints for the authenticated user.
 */
export async function GET(request: Request) {
  const { auth, error } = await parseRequest(request);

  if (error) return error();

  const endpoints = await getUserEndpoints(auth.user.id);

  return json({ data: endpoints });
}

/**
 * POST /api/postbacks
 * Creates a new postback endpoint.
 */
export async function POST(request: Request) {
  const { body, auth, error } = await parseRequest(request, createSchema);

  if (error) return error();

  // Generate slug if not provided
  const slug = body.slug || getRandomChars(12);

  // Check slug uniqueness
  const existing = await findEndpointBySlug(slug);
  if (existing) {
    return badRequest({ message: 'Slug already exists' });
  }

  // Create endpoint
  const endpoint = await createEndpoint({
    name: body.name,
    description: body.description,
    slug,
    receiveTemplateId: body.receiveTemplateId || null,
    relayTemplateId: body.relayTemplateId || null,
    relayTargetUrl: body.relayTargetUrl || null,
    config: body.config,
    website: { connect: { id: body.websiteId } },
    user: { connect: { id: auth.user.id } },
  });

  return json(endpoint);
}
