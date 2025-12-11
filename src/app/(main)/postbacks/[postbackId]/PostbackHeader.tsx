import { Button, Icon, Row } from '@umami/react-zen';
import { Badge } from '@/components/common/Badge';
import { PageHeader } from '@/components/common/PageHeader';
import { useMessages, usePostback, useSlug } from '@/components/hooks';
import { Copy, Webhook } from '@/components/icons';

/**
 * Header component for the postback detail page.
 * Shows endpoint name, status badges, and copy URL button.
 */
export function PostbackHeader() {
  const { formatMessage, labels } = useMessages();
  const { getSlugUrl } = useSlug('postback');
  const postback = usePostback();

  if (!postback) {
    return null;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(getSlugUrl(postback.slug));
  };

  return (
    <PageHeader
      title={
        <Row gap="3" alignItems="center">
          {postback.name}
          <Badge color={postback.isActive ? 'green' : 'gray'}>
            {postback.isActive ? formatMessage(labels.active) : formatMessage(labels.inactive)}
          </Badge>
          {postback.debugEnabled && <Badge color="blue">Debug</Badge>}
        </Row>
      }
      icon={<Webhook />}
    >
      <Button variant="quiet" onPress={handleCopy}>
        <Icon>
          <Copy />
        </Icon>
        {formatMessage(labels.copyUrl)}
      </Button>
    </PageHeader>
  );
}
