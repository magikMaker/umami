import { DataGrid } from '@/components/common/DataGrid';
import { useNavigation } from '@/components/hooks';
import { useRedirectsQuery } from '@/components/hooks/queries/useRedirectsQuery';
import { RedirectsTable } from './RedirectsTable';

export function RedirectsDataTable() {
  const { teamId } = useNavigation();
  const query = useRedirectsQuery({ teamId });

  return (
    <DataGrid query={query} allowSearch={true} autoFocus={false} allowPaging={true}>
      {({ data }) => <RedirectsTable data={data} />}
    </DataGrid>
  );
}
