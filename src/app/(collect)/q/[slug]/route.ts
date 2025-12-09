export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { POST } from '@/app/api/send/route';
import type { Link } from '@/generated/prisma/client';
import { ulid } from '@/lib/crypto';
import { getClientInfo } from '@/lib/detect';
import redis from '@/lib/redis';
import { notFound } from '@/lib/response';
import { createLinkClick, findLink } from '@/queries/prisma';

/**
 * Enhanced link redirect handler with click tracking.
 * Captures incoming parameters, generates click ID, and redirects.
 */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const url = new URL(request.url);

  // Find link (with Redis caching if available)
  let link: Link;

  if (redis.enabled) {
    link = await redis.client.fetch(
      `link:${slug}`,
      async () => {
        return findLink({
          where: { slug },
        });
      },
      86400,
    );

    if (!link) {
      return notFound();
    }
  } else {
    link = await findLink({
      where: { slug },
    });

    if (!link) {
      return notFound();
    }
  }

  // Extract tracking parameters from incoming URL
  const gclid = url.searchParams.get('gclid');
  const fbclid = url.searchParams.get('fbclid');
  const msclkid = url.searchParams.get('msclkid');
  const ttclid = url.searchParams.get('ttclid');
  const lifatid = url.searchParams.get('li_fat_id');
  const twclid = url.searchParams.get('twclid');

  const utmSource = url.searchParams.get('utm_source');
  const utmMedium = url.searchParams.get('utm_medium');
  const utmCampaign = url.searchParams.get('utm_campaign');
  const utmContent = url.searchParams.get('utm_content');
  const utmTerm = url.searchParams.get('utm_term');

  // Get client info
  const clientInfo = await getClientInfo(request, {});

  // Generate unique click ID (ULID)
  const clickId = ulid();

  // Store click record
  await createLinkClick({
    link: { connect: { id: link.id } },
    clickId,
    gclid,
    fbclid,
    msclkid,
    ttclid,
    lifatid,
    twclid,
    utmSource,
    utmMedium,
    utmCampaign,
    utmContent,
    utmTerm,
    referrer: request.headers.get('referer'),
    userAgent: clientInfo.userAgent,
    clientIp: clientInfo.ip,
    country: clientInfo.country,
    region: clientInfo.region,
    city: clientInfo.city,
  });

  // Record link event in analytics (existing behavior)
  const payload = {
    type: 'event',
    payload: {
      link: link.id,
      url: request.url,
      referrer: request.headers.get('referer'),
    },
  };

  const req = new Request(request.url, {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify(payload),
  });

  await POST(req);

  // Build redirect URL with click ID
  const redirectUrl = new URL(link.url);

  // Append click ID parameter (configurable name, default: click_id)
  const clickIdParam = link.clickIdParam || 'click_id';
  redirectUrl.searchParams.set(clickIdParam, clickId);

  // Append any additional configured parameters
  if (link.appendParams) {
    const appendParams = link.appendParams as Record<string, string>;
    for (const [key, value] of Object.entries(appendParams)) {
      // Support dynamic values like {utm_campaign}
      const resolvedValue = value.replace(/\{(\w+)\}/g, (_, param) => {
        return url.searchParams.get(param) || '';
      });
      if (resolvedValue) {
        redirectUrl.searchParams.set(key, resolvedValue);
      }
    }
  }

  return NextResponse.redirect(redirectUrl.toString());
}
