import { Column, Row, Text, TextField } from '@umami/react-zen';
import { Badge } from '@/components/common/Badge';
import { useMessages, usePostback, useSlug } from '@/components/hooks';
import { getReceiveTemplate, getRelayTemplate } from '@/lib/postback/templates';

/**
 * Details component showing postback endpoint information.
 * Displays the endpoint URL with copy functionality, templates, and description.
 */
export function PostbackDetails() {
  const { formatMessage, labels } = useMessages();
  const { getSlugUrl } = useSlug('postback');
  const postback = usePostback();

  if (!postback) {
    return null;
  }

  const receiveTemplate = postback.receiveTemplateId
    ? getReceiveTemplate(postback.receiveTemplateId)
    : null;
  const relayTemplate = postback.relayTemplateId
    ? getRelayTemplate(postback.relayTemplateId)
    : null;

  return (
    <Column gap="4" padding="4">
      <Column gap="2">
        <Text weight="bold">{formatMessage(labels.endpointUrl)}</Text>
        <TextField
          value={getSlugUrl(postback.slug)}
          isReadOnly
          allowCopy
          style={{ maxWidth: '500px' }}
        />
        <Text size="sm" type="muted">
          Send postback requests to this URL. Supports GET and POST methods.
        </Text>
      </Column>

      {postback.description && (
        <Column gap="2">
          <Text weight="bold">{formatMessage(labels.description)}</Text>
          <Text>{postback.description}</Text>
        </Column>
      )}

      <Row gap="6">
        <Column gap="2">
          <Text weight="bold">Receive Template</Text>
          {receiveTemplate ? (
            <Column gap="1">
              <Row gap="2" alignItems="center">
                <Badge color="blue">{receiveTemplate.name}</Badge>
                <Text size="sm" type="muted">
                  {receiveTemplate.source}
                </Text>
              </Row>
              <Text size="sm">{receiveTemplate.description}</Text>
            </Column>
          ) : (
            <Text type="muted">Generic (auto-detect fields)</Text>
          )}
        </Column>

        <Column gap="2">
          <Text weight="bold">Relay Template</Text>
          {relayTemplate ? (
            <Column gap="1">
              <Row gap="2" alignItems="center">
                <Badge color="green">{relayTemplate.name}</Badge>
                <Badge variant="outline">{relayTemplate.method}</Badge>
              </Row>
              <Text size="sm">{relayTemplate.description}</Text>
            </Column>
          ) : (
            <Text type="muted">None configured</Text>
          )}
        </Column>
      </Row>

      {postback.relayTargetUrl && (
        <Column gap="2">
          <Text weight="bold">Relay Target URL</Text>
          <TextField
            value={postback.relayTargetUrl}
            isReadOnly
            allowCopy
            style={{ maxWidth: '500px' }}
          />
        </Column>
      )}

      <Row gap="4">
        <Column gap="1">
          <Text size="sm" type="muted">
            {formatMessage(labels.created)}
          </Text>
          <Text>{new Date(postback.createdAt).toLocaleDateString()}</Text>
        </Column>
        {postback.updatedAt && (
          <Column gap="1">
            <Text size="sm" type="muted">
              Last updated
            </Text>
            <Text>{new Date(postback.updatedAt).toLocaleDateString()}</Text>
          </Column>
        )}
      </Row>
    </Column>
  );
}
