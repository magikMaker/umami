import { Column, Grid } from '@umami/react-zen';
import type { Metadata } from 'next';
import { PageBody } from '@/components/common/PageBody';
import { RedirectsList } from './RedirectsList';

/**
 * Redirects page showing all redirect links.
 */
export default function RedirectsPage() {
  return (
    <Grid width="100%" height="100%">
      <Column margin="2">
        <PageBody gap>
          <RedirectsList />
        </PageBody>
      </Column>
    </Grid>
  );
}

export const metadata: Metadata = {
  title: 'Redirects',
};
