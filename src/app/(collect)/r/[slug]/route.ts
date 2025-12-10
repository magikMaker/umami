export const dynamic = 'force-dynamic';

import { serializeError } from 'serialize-error';
import { ulid, uuid } from '@/lib/crypto';
import { getClientInfo } from '@/lib/detect';
import { notFound, serverError } from '@/lib/response';
import { createRedirectClick, findRedirectBySlug } from '@/queries/prisma';

/**
 * Parameter configuration for transforming query params.
 */
interface ParamConfig {
  // Parameters to capture (if empty, capture all)
  capture?: string[];
  // Parameters to pass through to target (if empty, pass all)
  passThrough?: string[];
  // Parameter mappings: { sourceParam: targetParam }
  mappings?: Record<string, string>;
  // The parameter that contains the external click ID
  clickIdParam?: string;
}

/**
 * Extracts parameters from the request URL based on config.
 */
function extractParams(
  url: URL,
  config: ParamConfig | null,
): {
  captured: Record<string, string>;
  passThrough: Record<string, string>;
  externalClickId: string | null;
} {
  const allParams: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    allParams[key] = value;
  });

  // If no config, capture and pass through all params
  if (!config) {
    return {
      captured: allParams,
      passThrough: allParams,
      externalClickId: null,
    };
  }

  // Capture specified params (or all if not specified)
  const captured: Record<string, string> = {};
  if (config.capture && config.capture.length > 0) {
    for (const param of config.capture) {
      if (allParams[param] !== undefined) {
        captured[param] = allParams[param];
      }
    }
  } else {
    Object.assign(captured, allParams);
  }

  // Build pass-through params with mappings
  const passThrough: Record<string, string> = {};
  const paramsToPass = config.passThrough?.length ? config.passThrough : Object.keys(allParams);

  for (const param of paramsToPass) {
    if (allParams[param] !== undefined) {
      // Apply mapping if exists
      const targetKey = config.mappings?.[param] || param;
      passThrough[targetKey] = allParams[param];
    }
  }

  // Extract external click ID if configured
  const externalClickId = config.clickIdParam ? allParams[config.clickIdParam] || null : null;

  return { captured, passThrough, externalClickId };
}

/**
 * Extracts common ad network identifiers from params.
 */
function extractAdNetworkIds(params: Record<string, string>): {
  gclid?: string;
  fbclid?: string;
  msclkid?: string;
  ttclid?: string;
  twclid?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
} {
  return {
    gclid: params.gclid,
    fbclid: params.fbclid,
    msclkid: params.msclkid,
    ttclid: params.ttclid,
    twclid: params.twclid,
    utmSource: params.utm_source,
    utmMedium: params.utm_medium,
    utmCampaign: params.utm_campaign,
    utmContent: params.utm_content,
    utmTerm: params.utm_term,
  };
}

/**
 * Builds the target URL with pass-through parameters.
 */
function buildTargetUrl(
  baseUrl: string,
  passThrough: Record<string, string>,
  clickToken: string,
): string {
  const url = new URL(baseUrl);

  // Add pass-through params
  for (const [key, value] of Object.entries(passThrough)) {
    url.searchParams.set(key, value);
  }

  // Add our click token for tracking
  url.searchParams.set('_ct', clickToken);

  return url.toString();
}

/**
 * Handles redirect requests.
 * Flow:
 * 1. Look up redirect by slug
 * 2. Extract and transform parameters
 * 3. Record the click with attribution data
 * 4. Redirect user to target URL
 */
async function handleRedirect(request: Request, params: { slug: string }): Promise<Response> {
  const { slug } = params;

  // Find redirect
  const redirect = await findRedirectBySlug(slug);

  if (!redirect || !redirect.isActive || redirect.deletedAt) {
    return notFound();
  }

  const url = new URL(request.url);
  const config = redirect.paramConfig as ParamConfig | null;

  // Extract parameters
  const { captured, passThrough, externalClickId } = extractParams(url, config);

  // Extract ad network IDs
  const adNetworkIds = extractAdNetworkIds(captured);

  // Get client info
  const clientInfo = await getClientInfo(request, {});

  // Generate click token (ULID for tracking)
  const clickToken = ulid();

  // Generate session ID for attribution tracking
  const sessionId = uuid(redirect.websiteId, clientInfo.ip, clientInfo.userAgent);

  // Record the click
  await createRedirectClick({
    id: uuid(),
    redirect: { connect: { id: redirect.id } },
    sessionId,
    clickToken,
    capturedParams: captured,
    externalClickId,
    ...adNetworkIds,
    referrer: request.headers.get('referer'),
    userAgent: clientInfo.userAgent,
    clientIp: clientInfo.ip,
    country: clientInfo.country,
    region: clientInfo.region,
    city: clientInfo.city,
  });

  // Build target URL
  const targetUrl = buildTargetUrl(redirect.targetUrl, passThrough, clickToken);

  // Redirect user
  return Response.redirect(targetUrl, 302);
}

/**
 * GET /r/[slug]
 * Handles redirect requests.
 */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    return handleRedirect(request, await params);
  } catch (e) {
    console.error(serializeError(e));
    return serverError();
  }
}
