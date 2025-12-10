'use client';
import { Column } from '@umami/react-zen';
import { PageBody } from '@/components/common/PageBody';
import { PageHeader } from '@/components/common/PageHeader';
import { Panel } from '@/components/common/Panel';
import { useMessages, useNavigation } from '@/components/hooks';
import { RedirectAddButton } from './RedirectAddButton';
import { RedirectsDataTable } from './RedirectsDataTable';

export function RedirectsPage() {
  const { formatMessage, labels } = useMessages();
  const { teamId } = useNavigation();

  return (
    <PageBody>
      <Column gap="6" margin="2">
        <PageHeader title={formatMessage(labels.redirects)}>
          <RedirectAddButton teamId={teamId} />
        </PageHeader>
        <Panel>
          <RedirectsDataTable />
        </Panel>
      </Column>
    </PageBody>
  );
}
