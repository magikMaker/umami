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
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { useMessages, usePostback } from '@/components/hooks';
import { usePostbackRequestsQuery } from '@/components/hooks/queries/usePostbackRequestsQuery';
import { Copy, Eye, RefreshCw, Trash2 } from '@/components/icons';
import { RequestPreview } from './RequestPreview';

/**
 * PostbackRequest interface matching the database model.
 */
interface PostbackRequest {
  id: string;
  method: string;
  path: string;
  query: Record<string, unknown>;
  headers: Record<string, string>;
  body: Record<string, unknown> | null;
  bodyRaw: string | null;
  clientIp: string | null;
  contentType: string | null;
  userAgent: string | null;
  parsedFields: Record<string, unknown> | null;
  validation: Record<string, unknown> | null;
  relayResult: Record<string, unknown> | null;
  status: string;
  createdAt: string;
}

/**
 * EndpointRequests displays incoming requests for a postback endpoint.
 * Shows request list with preview capability showing full processing pipeline.
 */
export function EndpointRequests() {
  const postback = usePostback();
  const { formatMessage, labels } = useMessages();
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data, isLoading, refetch } = usePostbackRequestsQuery(postback?.id || '', {
    refetchInterval: autoRefresh ? 5000 : false,
  });

  const requests = (data?.data || []) as PostbackRequest[];

  const handleClear = async () => {
    if (!postback) return;
    await fetch(`/api/postbacks/${postback.id}/requests/clear`, {
      method: 'POST',
    });
    refetch();
  };

  const handleCopyUrl = () => {
    if (!postback) return;
    navigator.clipboard.writeText(`${location.origin}/x/${postback.slug}`);
  };

  if (!postback) {
    return null;
  }

  return (
    <Column gap="4">
      {/* Toolbar */}
      <Row justifyContent="space-between" alignItems="center">
        <Row gap="2" alignItems="center">
          <Text size="sm" type="muted">
            Endpoint URL:
          </Text>
          <code>
            {typeof location !== 'undefined' ? location.origin : ''}/x/{postback.slug}
          </code>
          <Button variant="ghost" size="sm" onPress={handleCopyUrl}>
            <Icon size="sm">
              <Copy />
            </Icon>
          </Button>
        </Row>
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
          <Button variant="ghost" size="sm" onPress={handleClear}>
            <Icon size="sm">
              <Trash2 />
            </Icon>
            {formatMessage(labels.clear)}
          </Button>
        </Row>
      </Row>

      {/* Request List */}
      <Card>
        <Column>
          {isLoading && <Loading />}
          {!isLoading && requests.length === 0 && (
            <Column padding="4" alignItems="center">
              <Text type="muted">{formatMessage(labels.noRequests)}</Text>
              <Text size="sm" type="muted">
                Send a request to {typeof location !== 'undefined' ? location.origin : ''}/x/
                {postback.slug}
              </Text>
            </Column>
          )}
          {requests.map((req: PostbackRequest) => (
            <RequestListItem
              key={req.id}
              request={req}
              endpointId={postback.id}
              receiveTemplateId={postback.receiveTemplateId}
              relayTemplateId={postback.relayTemplateId}
            />
          ))}
        </Column>
      </Card>
    </Column>
  );
}

/**
 * RequestListItem displays a single request with preview button.
 */
function RequestListItem({
  request,
  endpointId,
  receiveTemplateId,
  relayTemplateId,
}: {
  request: PostbackRequest;
  endpointId: string;
  receiveTemplateId?: string | null;
  relayTemplateId?: string | null;
}) {
  const methodColors: Record<string, string> = {
    GET: 'blue',
    POST: 'green',
    PUT: 'orange',
    PATCH: 'yellow',
    DELETE: 'red',
  };

  const statusColors: Record<string, string> = {
    received: 'blue',
    valid: 'green',
    invalid: 'red',
    relayed: 'green',
    relay_failed: 'red',
  };

  return (
    <Row
      padding="3"
      gap="2"
      alignItems="center"
      style={{
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <Badge color={methodColors[request.method] || 'gray'}>{request.method}</Badge>
      <Column style={{ flex: 1, overflow: 'hidden' }}>
        <Text size="sm" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {request.path}
        </Text>
        <Text size="xs" type="muted">
          {formatDistanceToNow(new Date(request.createdAt), {
            addSuffix: true,
          })}
        </Text>
      </Column>
      <Badge color={statusColors[request.status] || 'gray'} variant="outline">
        {request.status}
      </Badge>
      <DialogTrigger>
        <Button variant="ghost" size="sm">
          <Icon size="sm">
            <Eye />
          </Icon>
        </Button>
        <Dialog>
          <Modal title="Request Preview" width="800px">
            {() => (
              <RequestPreview
                request={request}
                endpointId={endpointId}
                receiveTemplateId={receiveTemplateId}
                relayTemplateId={relayTemplateId}
              />
            )}
          </Modal>
        </Dialog>
      </DialogTrigger>
    </Row>
  );
}
