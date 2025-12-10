'use client';
import { Button, Column, Dialog, DialogTrigger, Icon, Modal, Row, Text } from '@umami/react-zen';
import Link from 'next/link';
import { Badge } from '@/components/common/Badge';
import { useMessages } from '@/components/hooks';
import { Edit, ExternalLink } from '@/components/icons';
import { RedirectDeleteButton } from '../RedirectDeleteButton';
import { RedirectEditForm } from '../RedirectEditForm';
import { useRedirect } from './useRedirect';

/**
 * Header for redirect detail page.
 * Shows name, status, and action buttons.
 */
export function RedirectHeader() {
  const { formatMessage, labels } = useMessages();
  const redirect = useRedirect();

  if (!redirect) {
    return null;
  }

  return (
    <Row justifyContent="space-between" alignItems="center">
      <Column>
        <Row gap="2" alignItems="center">
          <Link href="/redirects" style={{ textDecoration: 'none' }}>
            <Text type="muted">{formatMessage(labels.redirects)}</Text>
          </Link>
          <Text type="muted">/</Text>
          <Text size="lg" weight="bold">
            {redirect.name}
          </Text>
          <Badge color={redirect.isActive ? 'green' : 'gray'}>
            {redirect.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </Row>
        <Row gap="2" alignItems="center">
          <code style={{ fontSize: '12px' }}>/r/{redirect.slug}</code>
          <a href={redirect.targetUrl} target="_blank" rel="noopener noreferrer">
            <Icon size="sm">
              <ExternalLink />
            </Icon>
          </a>
        </Row>
      </Column>
      <Row gap="2">
        <DialogTrigger>
          <Button variant="secondary">
            <Icon>
              <Edit />
            </Icon>
            {formatMessage(labels.edit)}
          </Button>
          <Dialog>
            <Modal title={formatMessage(labels.editRedirect)} width="600px">
              {({ close }) => (
                <RedirectEditForm redirectId={redirect.id} onSave={close} onClose={close} />
              )}
            </Modal>
          </Dialog>
        </DialogTrigger>
        <RedirectDeleteButton redirectId={redirect.id} name={redirect.name} />
      </Row>
    </Row>
  );
}
