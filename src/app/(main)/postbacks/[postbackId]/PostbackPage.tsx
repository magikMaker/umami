'use client';
import { Column, Grid, Tab, TabList, TabPanel, Tabs } from '@umami/react-zen';
import { PostbackProvider } from '@/app/(main)/postbacks/PostbackProvider';
import { PageBody } from '@/components/common/PageBody';
import { Panel } from '@/components/common/Panel';
import { useMessages } from '@/components/hooks';
import { EndpointRelays } from './EndpointRelays';
import { EndpointRequests } from './EndpointRequests';
import { PostbackDetails } from './PostbackDetails';
import { PostbackHeader } from './PostbackHeader';

/**
 * Detail page for a single postback endpoint.
 * Shows endpoint information, URL, relay configuration, and incoming requests.
 */
export function PostbackPage({ postbackId }: { postbackId: string }) {
  const { formatMessage, labels } = useMessages();

  return (
    <PostbackProvider postbackId={postbackId}>
      <Grid width="100%" height="100%">
        <Column margin="2">
          <PageBody gap>
            <PostbackHeader />
            <Panel>
              <Tabs>
                <TabList>
                  <Tab id="details">{formatMessage(labels.details)}</Tab>
                  <Tab id="requests">{formatMessage(labels.requests)}</Tab>
                  <Tab id="relays">{formatMessage(labels.relays)}</Tab>
                </TabList>
                <TabPanel id="details">
                  <PostbackDetails />
                </TabPanel>
                <TabPanel id="requests">
                  <EndpointRequests />
                </TabPanel>
                <TabPanel id="relays">
                  <EndpointRelays />
                </TabPanel>
              </Tabs>
            </Panel>
          </PageBody>
        </Column>
      </Grid>
    </PostbackProvider>
  );
}
