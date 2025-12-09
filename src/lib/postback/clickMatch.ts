import { findLinkClickByClickId, markClickConverted } from '@/queries/prisma';

/**
 * Attempts to find and match a click record for a postback conversion.
 * Extracts click_id from various common parameter names.
 */
export async function matchClickToConversion(data: Record<string, unknown>): Promise<{
  clickId: string | null;
  linkClick: Awaited<ReturnType<typeof findLinkClickByClickId>> | null;
}> {
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
    return { clickId: null, linkClick: null };
  }

  // Find the original click
  const linkClick = await findLinkClickByClickId(clickId);

  if (linkClick) {
    // Mark as converted
    await markClickConverted(clickId);
  }

  return { clickId, linkClick };
}

/**
 * Extracts attribution data from a matched click.
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
