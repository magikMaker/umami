export const dynamic = 'force-dynamic';

import { serializeError } from 'serialize-error';
import { EVENT_TYPE, POSTBACK_STATUS } from '@/lib/constants';
import { uuid } from '@/lib/crypto';
import { getClientInfo } from '@/lib/detect';
import { getAttributionFromClick, matchClickToConversion } from '@/lib/postback/clickMatch';
import { parsePostbackRequest } from '@/lib/postback/parser';
import { relayToTargets } from '@/lib/postback/relay';
import { encodeBody, formatRelayPayload } from '@/lib/postback/relayFormatter';
import { parseWithTemplate } from '@/lib/postback/templateParser';
import { getReceiveTemplate, getRelayTemplate } from '@/lib/postback/templates';
import { extractRevenue, transformFields } from '@/lib/postback/transformer';
import { validatePostback } from '@/lib/postback/validator';
import { badRequest, json, notFound, serverError } from '@/lib/response';
import {
  createPostbackRequest,
  findActiveRelays,
  findEndpointBySlug,
  updatePostbackRequest,
} from '@/queries/prisma';
import { saveEvent, saveRevenue } from '@/queries/sql';

/**
 * Handles incoming postback requests.
 * Key flow:
 * 1. Parse and validate the request using templates
 * 2. Match to original click (if click_id present)
 * 3. Record conversion event with attribution
 * 4. Store revenue (if applicable)
 * 5. Relay to external targets (if configured)
 */
async function handlePostback(request: Request, params: { slug: string }) {
  const { slug } = params;

  // Find endpoint
  const endpoint = await findEndpointBySlug(slug);

  if (!endpoint || !endpoint.isActive || endpoint.deletedAt) {
    return notFound();
  }

  const config = endpoint.config as Record<string, unknown>;

  // Check allowed methods
  const allowedMethods = (config.allowedMethods as string[]) || ['GET', 'POST'];
  if (!allowedMethods.includes(request.method)) {
    return badRequest({ message: 'Method not allowed' });
  }

  // Parse incoming request
  const parsed = await parsePostbackRequest(request, config);

  // Get client info
  const clientInfo = await getClientInfo(request, {});

  // Get receive template if configured
  const receiveTemplate = endpoint.receiveTemplateId
    ? getReceiveTemplate(endpoint.receiveTemplateId)
    : null;

  // Parse and validate using template system
  const templateResult = parseWithTemplate(
    {
      method: parsed.method,
      path: new URL(request.url).pathname,
      query: parsed.query,
      headers: parsed.headers,
      body: parsed.body,
      bodyRaw: parsed.rawBody,
    },
    receiveTemplate,
    config,
  );

  // Always create request record for all incoming requests
  const requestRecord = await createPostbackRequest({
    endpoint: { connect: { id: endpoint.id } },
    method: request.method,
    path: new URL(request.url).pathname,
    query: parsed.query,
    headers: parsed.headers,
    body: parsed.body,
    bodyRaw: parsed.rawBody,
    clientIp: clientInfo.ip,
    contentType: parsed.contentType,
    userAgent: clientInfo.userAgent,
    status: POSTBACK_STATUS.received,
    parsedFields: templateResult.fields,
    validation: templateResult.validation,
  });

  // Validate using template validation (if configured) or legacy validation
  let validationResult = templateResult;
  if (!receiveTemplate) {
    // Fall back to legacy validation for endpoints without templates
    const legacyValidation = await validatePostback(parsed, config);
    validationResult = {
      isValid: legacyValidation.valid,
      validation: legacyValidation.valid ? null : { isValid: false, error: legacyValidation.error },
      fields: templateResult.fields,
    };
  }

  if (!validationResult.isValid) {
    await updatePostbackRequest(requestRecord.id, {
      validation: validationResult.validation,
      status: POSTBACK_STATUS.failed,
    });
    return badRequest({
      message: validationResult.validation?.error || 'Validation failed',
    });
  }

  // Transform fields - use template fields or legacy transform
  const transformedData = receiveTemplate
    ? (templateResult.fields as Record<string, unknown>)
    : transformFields(parsed, config);

  // Click-to-conversion matching
  // Attempt to match this postback to an original click
  // This enables full attribution: know which ad/campaign drove this
  // conversion
  const allData = { ...parsed.query, ...parsed.body };
  const { clickId, linkClick } = await matchClickToConversion(allData);

  // Merge attribution data from original click
  let attributionData: Record<string, unknown> = {};
  if (linkClick) {
    attributionData = getAttributionFromClick(linkClick);

    // Update request record with click match
    await updatePostbackRequest(requestRecord.id, {
      linkClickId: linkClick.id,
    });
  }

  // Combine transformed data with attribution
  const eventData = {
    ...transformedData,
    ...attributionData,
    matchedClickId: clickId,
    hasAttribution: !!linkClick,
  };

  // Extract revenue if configured
  const revenueData = extractRevenue(transformedData, config);

  // Create event
  const eventId = uuid();
  const eventConfig =
    (config.eventConfig as
      | {
          eventName?: string;
          recordRevenue?: boolean;
        }
      | undefined) || {};
  const eventName = eventConfig.eventName || 'conversion';

  // Use session from original click if available, otherwise generate new
  const sessionId =
    linkClick?.sessionId || uuid(endpoint.websiteId, clientInfo.ip, clientInfo.userAgent);

  await saveEvent({
    websiteId: endpoint.websiteId,
    sessionId, // Uses session from original click if matched
    visitId: uuid(),
    eventType: EVENT_TYPE.postbackEvent,
    eventName,
    eventData, // Includes both transformed data and attribution
    createdAt: new Date(),

    // Client info
    browser: clientInfo.browser,
    os: clientInfo.os,
    device: clientInfo.device,
    country: clientInfo.country,
    region: clientInfo.region,
    city: clientInfo.city,

    // URL info
    hostname: new URL(request.url).hostname,
    urlPath: `/x/${slug}`,
    urlQuery: new URL(request.url).search.slice(1),
  });

  // Handle revenue if configured
  if (revenueData?.revenue) {
    await saveRevenue({
      websiteId: endpoint.websiteId,
      sessionId,
      eventId,
      eventName,
      currency: revenueData.currency || 'USD',
      revenue: revenueData.revenue,
      createdAt: new Date(),
    });
  }

  // Update request record with final status
  await updatePostbackRequest(requestRecord.id, {
    status: POSTBACK_STATUS.recorded,
    eventId,
  });

  // Relay using template-based system if configured
  const relayTemplate = endpoint.relayTemplateId
    ? getRelayTemplate(endpoint.relayTemplateId)
    : null;

  if (relayTemplate && endpoint.relayTargetUrl) {
    // Template-based relay
    executeTemplateRelay(
      relayTemplate,
      endpoint.relayTargetUrl,
      transformedData,
      config,
      requestRecord.id,
    ).catch(err => console.error('Template relay error:', err));
  } else {
    // Legacy relay system (database-configured relays)
    const activeRelays = await findActiveRelays(endpoint.id);
    if (activeRelays.length > 0) {
      relayToTargets(
        activeRelays as unknown as Array<{
          id: string;
          name: string;
          targetUrl: string;
          method: string;
          format: string;
          mapping: Record<string, unknown>;
          headers: Record<string, string> | null;
          conditions: Record<string, unknown> | null;
          retryConfig: {
            maxAttempts: number;
            initialDelayMs: number;
            maxDelayMs: number;
            backoffMultiplier: number;
          } | null;
        }>,
        parsed,
        transformedData,
        requestRecord.id,
      ).catch(err => console.error('Relay error:', err));
    }
  }

  // Return response based on config
  const responseConfig =
    (config.response as
      | {
          mode?: string;
          successCode?: number;
        }
      | undefined) || {};
  const responseMode = responseConfig.mode || 'minimal';

  if (responseMode === 'minimal') {
    return new Response(null, {
      status: responseConfig.successCode || 200,
    });
  }

  return json({
    status: 'ok',
    eventId,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Executes a template-based relay to the target URL.
 */
async function executeTemplateRelay(
  template: NonNullable<ReturnType<typeof getRelayTemplate>>,
  targetUrl: string,
  fields: Record<string, unknown>,
  config: Record<string, unknown>,
  requestId: string,
): Promise<void> {
  const startTime = Date.now();

  try {
    // Format the relay payload using the template
    const formatted = formatRelayPayload(fields, template, config);

    // Build the full URL (target URL may override template URL)
    const url = targetUrl || formatted.url;

    // Encode the body based on template format
    const { contentType, data } = encodeBody(formatted.body, template.format);

    // Merge headers
    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'User-Agent': 'Umami-Postback-Relay/1.0',
      ...formatted.headers,
    };

    // Send the request
    const response = await fetch(url, {
      method: formatted.method,
      headers,
      body: ['GET', 'HEAD'].includes(formatted.method) ? undefined : data,
    });

    const responseBody = await response.text();
    const duration = Date.now() - startTime;

    // Update request record with relay result
    await updatePostbackRequest(requestId, {
      relayResult: {
        success: response.ok,
        url,
        method: formatted.method,
        body: formatted.body,
        statusCode: response.status,
        responseBody: responseBody.slice(0, 1000),
        duration,
      },
      status: response.ok ? POSTBACK_STATUS.relayed : POSTBACK_STATUS.relayFailed,
    });

    if (!response.ok) {
      console.error(`Template relay failed: ${response.status} ${responseBody}`);
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Update request record with error
    await updatePostbackRequest(requestId, {
      relayResult: {
        success: false,
        error: errorMessage,
        duration,
      },
      status: POSTBACK_STATUS.relayFailed,
    });

    console.error('Template relay error:', error);
  }
}

/**
 * GET /x/[slug]
 * Handles GET requests for postback ingestion.
 */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    return handlePostback(request, await params);
  } catch (e) {
    console.error(serializeError(e));
    return serverError();
  }
}

/**
 * POST /x/[slug]
 * Handles POST requests for postback ingestion.
 */
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    return handlePostback(request, await params);
  } catch (e) {
    console.error(serializeError(e));
    return serverError();
  }
}

/**
 * PUT /x/[slug]
 * Handles PUT requests for postback ingestion.
 */
export async function PUT(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    return handlePostback(request, await params);
  } catch (e) {
    console.error(serializeError(e));
    return serverError();
  }
}

/**
 * PATCH /x/[slug]
 * Handles PATCH requests for postback ingestion.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    return handlePostback(request, await params);
  } catch (e) {
    console.error(serializeError(e));
    return serverError();
  }
}

/**
 * DELETE /x/[slug]
 * Handles DELETE requests for postback ingestion.
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    return handlePostback(request, await params);
  } catch (e) {
    console.error(serializeError(e));
    return serverError();
  }
}
