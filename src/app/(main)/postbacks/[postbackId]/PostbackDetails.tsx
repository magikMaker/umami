import { Column, Row, Text, TextField } from '@umami/react-zen';
import { useMessages, usePostback, useSlug } from '@/components/hooks';

/**
 * Details component showing postback endpoint information.
 * Displays the endpoint URL with copy functionality and description.
 */
export function PostbackDetails() {
  const { formatMessage, labels } = useMessages();
  const { getSlugUrl } = useSlug('postback');
  const postback = usePostback();

  if (!postback) {
    return null;
  }

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

      <Column gap="2">
        <Text weight="bold">{formatMessage(labels.debugMode)}</Text>
        <Text>
          {postback.debugEnabled
            ? 'Enabled - Incoming requests will be logged for inspection.'
            : 'Disabled - Requests are processed but not logged.'}
        </Text>
      </Column>

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
