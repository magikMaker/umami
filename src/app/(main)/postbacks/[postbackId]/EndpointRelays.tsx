'use client';
import { Button, Column, Dialog, DialogTrigger, Icon, Modal, Row, Text } from '@umami/react-zen';
import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { useMessages, usePostback } from '@/components/hooks';
import { useRelaysQuery } from '@/components/hooks/queries/useRelaysQuery';
import { Edit, Pause, Play, Plus, Trash2 } from '@/components/icons';
import { RelayEditForm } from './RelayEditForm';

/**
 * Relay configuration interface.
 */
interface Relay {
  id: string;
  name: string;
  targetUrl: string;
  method: string;
  format: string;
  isActive: boolean;
}

/**
 * Component displaying and managing relays for a postback endpoint.
 * Shows list of configured relays with create, edit, toggle, and delete.
 */
export function EndpointRelays() {
  const postback = usePostback();
  useMessages();
  const { data, refetch } = useRelaysQuery(postback?.id || '');

  const relays = (data?.data || []) as Relay[];

  const handleToggle = async (relayId: string, isActive: boolean) => {
    await fetch(`/api/postbacks/${postback?.id}/relays/${relayId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !isActive }),
    });
    refetch();
  };

  const handleDelete = async (relayId: string) => {
    if (confirm('Delete this relay?')) {
      await fetch(`/api/postbacks/${postback?.id}/relays/${relayId}`, {
        method: 'DELETE',
      });
      refetch();
    }
  };

  if (!postback) {
    return null;
  }

  return (
    <Column gap="4" padding="4">
      <Row justifyContent="space-between" alignItems="center">
        <Text weight="bold">Relay Targets</Text>
        <DialogTrigger>
          <Button variant="primary" size="sm">
            <Icon size="sm">
              <Plus />
            </Icon>
            Add Relay
          </Button>
          <Dialog>
            <Modal title="Add Relay">
              {({ close }) => (
                <RelayEditForm
                  endpointId={postback.id}
                  onSave={() => {
                    close();
                    refetch();
                  }}
                  onClose={close}
                />
              )}
            </Modal>
          </Dialog>
        </DialogTrigger>
      </Row>

      {relays.length === 0 ? (
        <Card>
          <Column padding="4" alignItems="center">
            <Text type="muted">No relays configured</Text>
            <Text size="sm" type="muted">
              Add a relay to forward postback data to external systems
            </Text>
          </Column>
        </Card>
      ) : (
        <Column gap="2">
          {relays.map((relay: Relay) => (
            <RelayCard
              key={relay.id}
              relay={relay}
              endpointId={postback.id}
              onToggle={() => handleToggle(relay.id, relay.isActive)}
              onDelete={() => handleDelete(relay.id)}
              onUpdate={refetch}
            />
          ))}
        </Column>
      )}
    </Column>
  );
}

/**
 * Card component displaying a single relay with actions.
 */
function RelayCard({
  relay,
  endpointId,
  onToggle,
  onDelete,
  onUpdate,
}: {
  relay: Relay;
  endpointId: string;
  onToggle: () => void;
  onDelete: () => void;
  onUpdate: () => void;
}) {
  const methodColors: Record<string, string> = {
    GET: 'blue',
    POST: 'green',
    PUT: 'orange',
    PATCH: 'yellow',
    DELETE: 'red',
  };

  return (
    <Card>
      <Row padding="3" justifyContent="space-between" alignItems="center">
        <Row gap="3" alignItems="center">
          <Badge color={relay.isActive ? 'green' : 'gray'} variant="dot">
            {relay.isActive ? 'Active' : 'Inactive'}
          </Badge>
          <Column>
            <Text weight="medium">{relay.name}</Text>
            <Row gap="2" alignItems="center">
              <Badge color={methodColors[relay.method]} size="sm">
                {relay.method}
              </Badge>
              <Text size="sm" type="muted">
                {relay.targetUrl}
              </Text>
            </Row>
          </Column>
        </Row>
        <Row gap="1">
          <Button variant="ghost" size="sm" onPress={onToggle}>
            <Icon size="sm">{relay.isActive ? <Pause /> : <Play />}</Icon>
          </Button>
          <DialogTrigger>
            <Button variant="ghost" size="sm">
              <Icon size="sm">
                <Edit />
              </Icon>
            </Button>
            <Dialog>
              <Modal title="Edit Relay">
                {({ close }) => (
                  <RelayEditForm
                    endpointId={endpointId}
                    relayId={relay.id}
                    onSave={() => {
                      close();
                      onUpdate();
                    }}
                    onClose={close}
                  />
                )}
              </Modal>
            </Dialog>
          </DialogTrigger>
          <Button variant="ghost" size="sm" onPress={onDelete}>
            <Icon size="sm">
              <Trash2 />
            </Icon>
          </Button>
        </Row>
      </Row>
    </Card>
  );
}
