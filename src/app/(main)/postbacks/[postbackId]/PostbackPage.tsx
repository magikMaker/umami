'use client';
import { Column, Grid } from '@umami/react-zen';
import { PostbackProvider } from '@/app/(main)/postbacks/PostbackProvider';
import { PageBody } from '@/components/common/PageBody';
import { Panel } from '@/components/common/Panel';
import { PostbackDetails } from './PostbackDetails';
import { PostbackHeader } from './PostbackHeader';

/**
 * Detail page for a single postback endpoint.
 * Shows endpoint information, URL, and debug/relay configuration.
 */
export function PostbackPage({ postbackId }: { postbackId: string }) {
  return (
    <PostbackProvider postbackId={postbackId}>
      <Grid width="100%" height="100%">
        <Column margin="2">
          <PageBody gap>
            <PostbackHeader />
            <Panel>
              <PostbackDetails />
            </Panel>
          </PageBody>
        </Column>
      </Grid>
    </PostbackProvider>
  );
}
