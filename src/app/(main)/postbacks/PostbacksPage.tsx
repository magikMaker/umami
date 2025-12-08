'use client';
import { Column } from '@umami/react-zen';
import { PageBody } from '@/components/common/PageBody';
import { PageHeader } from '@/components/common/PageHeader';
import { Panel } from '@/components/common/Panel';
import { useMessages, useNavigation } from '@/components/hooks';
import { PostbackAddButton } from './PostbackAddButton';
import { PostbacksDataTable } from './PostbacksDataTable';

/**
 * Main page component for the Postback module.
 * Displays a list of postback endpoints with search and create functionality.
 */
export function PostbacksPage() {
  const { formatMessage, labels } = useMessages();
  const { teamId } = useNavigation();

  return (
    <PageBody>
      <Column gap="6" margin="2">
        <PageHeader title={formatMessage(labels.postbacks)}>
          <PostbackAddButton teamId={teamId} />
        </PageHeader>
        <Panel>
          <PostbacksDataTable />
        </Panel>
      </Column>
    </PageBody>
  );
}
