import { DataColumn, DataTable, type DataTableProps, Icon, Row } from '@umami/react-zen';
import Link from 'next/link';
import { DateDistance } from '@/components/common/DateDistance';
import { ExternalLink } from '@/components/common/ExternalLink';
import { LinkButton } from '@/components/common/LinkButton';
import { useMessages, useNavigation, useSlug } from '@/components/hooks';
import { Eye } from '@/components/icons';
import { PostbackDeleteButton } from './PostbackDeleteButton';
import { PostbackEditButton } from './PostbackEditButton';

/**
 * Table component for displaying postback endpoints.
 * Shows name, endpoint URL, creation date, and action buttons.
 */
export function PostbacksTable(props: DataTableProps) {
  const { formatMessage, labels } = useMessages();
  const { renderUrl } = useNavigation();
  const { getSlugUrl } = useSlug('postback');

  return (
    <DataTable {...props}>
      <DataColumn id="name" label={formatMessage(labels.name)}>
        {({ id, name }: { id: string; name: string }) => {
          return <Link href={renderUrl(`/postbacks/${id}`)}>{name}</Link>;
        }}
      </DataColumn>
      <DataColumn id="url" label={formatMessage(labels.endpointUrl)}>
        {({ slug }: { slug: string }) => {
          const url = getSlugUrl(slug);
          return (
            <ExternalLink href={url} prefetch={false}>
              {url}
            </ExternalLink>
          );
        }}
      </DataColumn>
      <DataColumn id="created" label={formatMessage(labels.created)}>
        {(row: { createdAt: string }) => <DateDistance date={new Date(row.createdAt)} />}
      </DataColumn>
      <DataColumn id="action" align="end" width="140px">
        {(row: { id: string; name: string }) => {
          const { id, name } = row;

          return (
            <Row>
              <LinkButton href={renderUrl(`/postbacks/${id}`)} variant="quiet">
                <Icon>
                  <Eye />
                </Icon>
              </LinkButton>
              <PostbackEditButton postbackId={id} />
              <PostbackDeleteButton postbackId={id} name={name} />
            </Row>
          );
        }}
      </DataColumn>
    </DataTable>
  );
}
