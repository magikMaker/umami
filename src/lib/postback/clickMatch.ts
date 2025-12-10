import {
  findLinkClickByClickId,
  findRedirectClickByExternalId,
  findRedirectClickByToken,
  markClickConverted,
  updateRedirectClick,
} from '@/queries/prisma';

/**
 * Click match result containing either a LinkClick or RedirectClick.
 */
export interface ClickMatchResult {
  clickId: string | null;
  linkClick: Awaited<ReturnType<typeof findLinkClickByClickId>> | null;
  redirectClick: Awaited<ReturnType<typeof findRedirectClickByToken>> | null;
}

/**
 * Attempts to find and match a click record for a postback conversion.
 * Searches both LinkClick (legacy) and RedirectClick (new module).
 * Extracts click_id from various common parameter names.
 */
export async function matchClickToConversion(
  data: Record<string, unknown>,
): Promise<ClickMatchResult> {
  // Try common click ID parameter names
  const clickIdParams = [
    'click_id',
    'clickId',
    'clickid',
    'cid',
    'subid',
    'sub1',
    'transaction_id',
    'tid',
    'aff_sub',
    '_ct', // Our redirect click token
  ];

  let clickId: string | null = null;

  for (const param of clickIdParams) {
    const value = data[param];
    if (typeof value === 'string' && value.length > 0) {
      clickId = value;
      break;
    }
  }

  if (!clickId) {
    return { clickId: null, linkClick: null, redirectClick: null };
  }

  // First, try to find a RedirectClick by token (our generated ULID)
  let redirectClick = await findRedirectClickByToken(clickId);

  // If not found, try by external click ID
  if (!redirectClick) {
    redirectClick = await findRedirectClickByExternalId(clickId);
  }

  if (redirectClick) {
    // Mark as converted
    await updateRedirectClick(redirectClick.id, {
      convertedAt: new Date(),
    });
    return { clickId, linkClick: null, redirectClick };
  }

  // Fall back to legacy LinkClick
  const linkClick = await findLinkClickByClickId(clickId);

  if (linkClick) {
    // Mark as converted
    await markClickConverted(clickId);
  }

  return { clickId, linkClick, redirectClick: null };
}

/**
 * Extracts attribution data from a matched LinkClick.
 */
export function getAttributionFromClick(
  linkClick: NonNullable<Awaited<ReturnType<typeof findLinkClickByClickId>>>,
): Record<string, unknown> {
  return {
    originalClickId: linkClick.clickId,
    clickedAt: linkClick.createdAt,
    timeToConversion: linkClick.createdAt
      ? Date.now() - new Date(linkClick.createdAt).getTime()
      : null,

    // Traffic source
    gclid: linkClick.gclid,
    fbclid: linkClick.fbclid,
    msclkid: linkClick.msclkid,
    ttclid: linkClick.ttclid,

    // UTM parameters
    utmSource: linkClick.utmSource,
    utmMedium: linkClick.utmMedium,
    utmCampaign: linkClick.utmCampaign,
    utmContent: linkClick.utmContent,
    utmTerm: linkClick.utmTerm,

    // Geographic
    country: linkClick.country,
    region: linkClick.region,
    city: linkClick.city,

    // Link info
    linkId: linkClick.link?.id,
    linkName: linkClick.link?.name,
    linkSlug: linkClick.link?.slug,
  };
}

/**
 * Extracts attribution data from a matched RedirectClick.
 */
export function getAttributionFromRedirectClick(
  redirectClick: NonNullable<Awaited<ReturnType<typeof findRedirectClickByToken>>>,
): Record<string, unknown> {
  return {
    originalClickToken: redirectClick.clickToken,
    externalClickId: redirectClick.externalClickId,
    clickedAt: redirectClick.createdAt,
    timeToConversion: redirectClick.createdAt
      ? Date.now() - new Date(redirectClick.createdAt).getTime()
      : null,

    // Traffic source
    gclid: redirectClick.gclid,
    fbclid: redirectClick.fbclid,
    msclkid: redirectClick.msclkid,
    ttclid: redirectClick.ttclid,
    twclid: redirectClick.twclid,

    // UTM parameters
    utmSource: redirectClick.utmSource,
    utmMedium: redirectClick.utmMedium,
    utmCampaign: redirectClick.utmCampaign,
    utmContent: redirectClick.utmContent,
    utmTerm: redirectClick.utmTerm,

    // Geographic
    country: redirectClick.country,
    region: redirectClick.region,
    city: redirectClick.city,

    // Redirect info
    redirectId: redirectClick.redirect?.id,
    redirectName: redirectClick.redirect?.name,
    redirectSlug: redirectClick.redirect?.slug,

    // Captured params
    capturedParams: redirectClick.capturedParams,
  };
}
