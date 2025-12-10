'use client';
import {
  Button,
  Column,
  Dialog,
  DialogTrigger,
  Icon,
  Loading,
  Modal,
  Row,
  Text,
} from '@umami/react-zen';
import Link from 'next/link';
import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { useMessages } from '@/components/hooks';
import { useRedirectsQuery } from '@/components/hooks/queries/useRedirectsQuery';
import { Copy, ExternalLink, Plus } from '@/components/icons';
import { RedirectEditForm } from './RedirectEditForm';

/**
 * Redirect data from the API.
 */
interface Redirect {
  id: string;
  name: string;
  slug: string;
  targetUrl: string;
  isActive: boolean;
  createdAt: string;
  _count?: {
    clicks: number;
  };
}

/**
 * RedirectsList displays all redirects with create button.
 */
export function RedirectsList() {
  const { formatMessage, labels } = useMessages();
  const { data, isLoading, refetch } = useRedirectsQuery();

  const redirects = (data || []) as Redirect[];

  const handleCopyUrl = (slug: string) => {
    const url = `${typeof location !== 'undefined' ? location.origin : ''}/r/${slug}`;
    navigator.clipboard.writeText(url);
  };

  return (
    <Column gap="4">
      <Row justifyContent="space-between" alignItems="center">
        <Text size="lg" weight="bold">
          {formatMessage(labels.redirects)}
        </Text>
        <DialogTrigger>
          <Button variant="primary">
            <Icon>
              <Plus />
            </Icon>
            {formatMessage(labels.createRedirect)}
          </Button>
          <Dialog>
            <Modal title={formatMessage(labels.createRedirect)} width="600px">
              {({ close }) => (
                <RedirectEditForm
                  onSave={() => {
                    refetch();
                    close();
                  }}
                  onClose={close}
                />
              )}
            </Modal>
          </Dialog>
        </DialogTrigger>
      </Row>

      <Card>
        {isLoading && <Loading />}
        {!isLoading && redirects.length === 0 && (
          <Column padding="6" alignItems="center">
            <Text type="muted">{formatMessage(labels.noRedirects)}</Text>
            <Text size="sm" type="muted">
              Create a redirect to start tracking ad clicks
            </Text>
          </Column>
        )}
        {redirects.map(redirect => (
          <Row
            key={redirect.id}
            padding="3"
            gap="3"
            alignItems="center"
            style={{ borderBottom: '1px solid var(--color-border)' }}
          >
            <Column style={{ flex: 1 }}>
              <Link href={`/redirects/${redirect.id}`} style={{ textDecoration: 'none' }}>
                <Text weight="bold">{redirect.name}</Text>
              </Link>
              <Row gap="2" alignItems="center">
                <code style={{ fontSize: '12px' }}>/r/{redirect.slug}</code>
                <Button variant="ghost" size="sm" onPress={() => handleCopyUrl(redirect.slug)}>
                  <Icon size="sm">
                    <Copy />
                  </Icon>
                </Button>
              </Row>
            </Column>
            <Column alignItems="center" style={{ minWidth: '80px' }}>
              <Text size="lg" weight="bold">
                {redirect._count?.clicks || 0}
              </Text>
              <Text size="xs" type="muted">
                clicks
              </Text>
            </Column>
            <Badge color={redirect.isActive ? 'green' : 'gray'}>
              {redirect.isActive ? 'Active' : 'Inactive'}
            </Badge>
            <a href={redirect.targetUrl} target="_blank" rel="noopener noreferrer">
              <Icon size="sm">
                <ExternalLink />
              </Icon>
            </a>
          </Row>
        ))}
      </Card>
    </Column>
  );
}
