'use client';
import { Button, Column, Icon, Loading, Row, Text } from '@umami/react-zen';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { useMessages } from '@/components/hooks';
import { useRedirectClicksQuery } from '@/components/hooks/queries/useRedirectClicksQuery';
import { RefreshCw } from '@/components/icons';
import { useRedirect } from './useRedirect';

/**
 * Click data from the API.
 */
interface RedirectClick {
  id: string;
  clickToken: string;
  externalClickId: string | null;
  capturedParams: Record<string, string> | null;
  gclid: string | null;
  fbclid: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  country: string | null;
  city: string | null;
  createdAt: string;
  convertedAt: string | null;
}

/**
 * RedirectClicks displays click history for a redirect.
 */
export function RedirectClicks() {
  const redirect = useRedirect();
  const { formatMessage, labels } = useMessages();
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data, isLoading, refetch } = useRedirectClicksQuery(redirect?.id || '', {
    refetchInterval: autoRefresh ? 5000 : false,
  });

  const clicks = (data?.data || []) as RedirectClick[];

  if (!redirect) {
    return null;
  }

  return (
    <Column gap="4" padding="4">
      <Row justifyContent="space-between" alignItems="center">
        <Text weight="bold">Click History</Text>
        <Row gap="2">
          <Button
            variant={autoRefresh ? 'primary' : 'secondary'}
            size="sm"
            onPress={() => setAutoRefresh(!autoRefresh)}
          >
            <Icon size="sm">
              <RefreshCw />
            </Icon>
            {autoRefresh
              ? formatMessage(labels.autoRefreshOn)
              : formatMessage(labels.autoRefreshOff)}
          </Button>
          <Button variant="ghost" size="sm" onPress={() => refetch()}>
            <Icon size="sm">
              <RefreshCw />
            </Icon>
          </Button>
        </Row>
      </Row>

      <Card>
        {isLoading && <Loading />}
        {!isLoading && clicks.length === 0 && (
          <Column padding="6" alignItems="center">
            <Text type="muted">{formatMessage(labels.noClicks)}</Text>
            <Text size="sm" type="muted">
              Clicks will appear here when users visit the redirect URL
            </Text>
          </Column>
        )}
        {clicks.map(click => (
          <ClickRow key={click.id} click={click} />
        ))}
      </Card>
    </Column>
  );
}

/**
 * Single click row component.
 */
function ClickRow({ click }: { click: RedirectClick }) {
  const [expanded, setExpanded] = useState(false);

  // Determine the source badge
  let source = 'Direct';
  let sourceColor = 'gray';
  if (click.gclid) {
    source = 'Google';
    sourceColor = 'blue';
  } else if (click.fbclid) {
    source = 'Facebook';
    sourceColor = 'blue';
  } else if (click.utmSource) {
    source = click.utmSource;
    sourceColor = 'purple';
  }

  return (
    <Column
      style={{
        borderBottom: '1px solid var(--color-border)',
        cursor: 'pointer',
      }}
      onClick={() => setExpanded(!expanded)}
    >
      <Row padding="3" gap="3" alignItems="center">
        <Column style={{ flex: 1 }}>
          <Row gap="2" alignItems="center">
            <code style={{ fontSize: '11px' }}>{click.clickToken.slice(0, 8)}...</code>
            {click.externalClickId && (
              <Badge color="yellow" variant="outline">
                {click.externalClickId.slice(0, 12)}...
              </Badge>
            )}
          </Row>
          <Text size="xs" type="muted">
            {formatDistanceToNow(new Date(click.createdAt), {
              addSuffix: true,
            })}
          </Text>
        </Column>
        <Badge color={sourceColor}>{source}</Badge>
        {click.country && (
          <Text size="sm" type="muted">
            {click.country}
            {click.city && `, ${click.city}`}
          </Text>
        )}
        {click.convertedAt && <Badge color="green">Converted</Badge>}
      </Row>

      {expanded && click.capturedParams && (
        <Column padding="3" style={{ background: 'var(--base100)' }}>
          <Text size="xs" weight="bold" type="muted">
            Captured Parameters
          </Text>
          <pre
            style={{
              fontSize: '11px',
              margin: '8px 0 0 0',
              overflow: 'auto',
            }}
          >
            {JSON.stringify(click.capturedParams, null, 2)}
          </pre>
        </Column>
      )}
    </Column>
  );
}
