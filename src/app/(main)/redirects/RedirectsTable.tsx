import { DataColumn, DataTable, type DataTableProps, Icon, Row } from '@umami/react-zen';
import Link from 'next/link';
import { DateDistance } from '@/components/common/DateDistance';
import { ExternalLink } from '@/components/common/ExternalLink';
import { LinkButton } from '@/components/common/LinkButton';
import { useMessages, useNavigation, useSlug } from '@/components/hooks';
import { Eye } from '@/components/icons';
import { RedirectDeleteButton } from './RedirectDeleteButton';
import { RedirectEditButton } from './RedirectEditButton';

export function RedirectsTable(props: DataTableProps) {
  const { formatMessage, labels } = useMessages();
  const { websiteId, renderUrl } = useNavigation();
  const { getSlugUrl } = useSlug('redirect');

  return (
    <DataTable {...props}>
      <DataColumn id="name" label={formatMessage(labels.name)}>
        {({ id, name }: { id: string; name: string }) => {
          return <Link href={renderUrl(`/redirects/${id}`)}>{name}</Link>;
        }}
      </DataColumn>
      <DataColumn id="slug" label={formatMessage(labels.redirect)}>
        {({ slug }: { slug: string }) => {
          const url = getSlugUrl(slug);
          return (
            <ExternalLink href={url} prefetch={false}>
              {url}
            </ExternalLink>
          );
        }}
      </DataColumn>
      <DataColumn id="targetUrl" label={formatMessage(labels.destinationUrl)}>
        {({ targetUrl }: { targetUrl: string }) => {
          return <ExternalLink href={targetUrl}>{targetUrl}</ExternalLink>;
        }}
      </DataColumn>
      <DataColumn id="created" label={formatMessage(labels.created)} width="200px">
        {(row: { createdAt: string }) => <DateDistance date={new Date(row.createdAt)} />}
      </DataColumn>
      <DataColumn id="action" align="end" width="140px">
        {({ id, name }: { id: string; name: string }) => {
          return (
            <Row>
              <LinkButton href={renderUrl(`/redirects/${id}`)} variant="quiet">
                <Icon>
                  <Eye />
                </Icon>
              </LinkButton>
              <RedirectEditButton redirectId={id} />
              <RedirectDeleteButton redirectId={id} websiteId={websiteId} name={name} />
            </Row>
          );
        }}
      </DataColumn>
    </DataTable>
  );
}
