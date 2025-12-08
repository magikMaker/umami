import { DataGrid } from '@/components/common/DataGrid';
import { useNavigation, usePostbacksQuery } from '@/components/hooks';
import { PostbacksTable } from './PostbacksTable';

/**
 * Data grid wrapper for postback endpoints with search and pagination.
 */
export function PostbacksDataTable() {
  const { teamId } = useNavigation();
  const query = usePostbacksQuery({ teamId });

  return (
    <DataGrid query={query} allowSearch={true} autoFocus={false} allowPaging={true}>
      {({ data }) => <PostbacksTable data={data} />}
    </DataGrid>
  );
}
