'use client';
import { Column, Row, Text, TextField } from '@umami/react-zen';
import { Badge } from '@/components/common/Badge';
import { useMessages, useSlug } from '@/components/hooks';
import { useRedirect } from './useRedirect';

/**
 * Details component showing redirect information.
 * Displays the redirect URL with copy functionality, target, and stats.
 */
export function RedirectDetails() {
  const { formatMessage, labels } = useMessages();
  const { getSlugUrl } = useSlug('redirect');
  const redirect = useRedirect();

  if (!redirect) {
    return null;
  }

  return (
    <Column gap="4" padding="4">
      <Column gap="2">
        <Text weight="bold">Redirect URL</Text>
        <TextField
          value={getSlugUrl(redirect.slug)}
          isReadOnly
          allowCopy
          style={{ maxWidth: '500px' }}
        />
        <Text size="sm" type="muted">
          Use this URL in your ad campaigns. Clicks will be tracked and users redirected to the
          target.
        </Text>
      </Column>

      <Column gap="2">
        <Text weight="bold">Target URL</Text>
        <TextField value={redirect.targetUrl} isReadOnly allowCopy style={{ maxWidth: '500px' }} />
      </Column>

      {redirect.description && (
        <Column gap="2">
          <Text weight="bold">{formatMessage(labels.description)}</Text>
          <Text>{redirect.description}</Text>
        </Column>
      )}

      {redirect.stats && (
        <Row gap="6">
          <Column gap="1">
            <Text size="xs" type="muted">
              Total Clicks
            </Text>
            <Text size="xl" weight="bold">
              {redirect.stats.totalClicks}
            </Text>
          </Column>
          <Column gap="1">
            <Text size="xs" type="muted">
              Conversions
            </Text>
            <Text size="xl" weight="bold">
              {redirect.stats.conversions}
            </Text>
          </Column>
          <Column gap="1">
            <Text size="xs" type="muted">
              Conversion Rate
            </Text>
            <Text size="xl" weight="bold">
              {(redirect.stats.conversionRate * 100).toFixed(1)}%
            </Text>
          </Column>
        </Row>
      )}

      {redirect.paramConfig?.clickIdParam && (
        <Column gap="2">
          <Text weight="bold">Click ID Parameter</Text>
          <Row gap="2" alignItems="center">
            <Badge color="blue">{redirect.paramConfig.clickIdParam}</Badge>
            <Text size="sm" type="muted">
              This parameter will be captured for conversion tracking
            </Text>
          </Row>
        </Column>
      )}

      <Row gap="4">
        <Column gap="1">
          <Text size="sm" type="muted">
            {formatMessage(labels.created)}
          </Text>
          <Text>{new Date(redirect.createdAt).toLocaleDateString()}</Text>
        </Column>
        {redirect.updatedAt && (
          <Column gap="1">
            <Text size="sm" type="muted">
              Last updated
            </Text>
            <Text>{new Date(redirect.updatedAt).toLocaleDateString()}</Text>
          </Column>
        )}
      </Row>
    </Column>
  );
}
