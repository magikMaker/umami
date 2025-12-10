'use client';
import { Column, Grid, Tab, TabList, TabPanel, Tabs } from '@umami/react-zen';
import { PageBody } from '@/components/common/PageBody';
import { Panel } from '@/components/common/Panel';
import { useMessages } from '@/components/hooks';
import { RedirectProvider } from '../RedirectProvider';
import { RedirectClicks } from './RedirectClicks';
import { RedirectDetails } from './RedirectDetails';
import { RedirectHeader } from './RedirectHeader';

/**
 * Detail page for a single redirect.
 * Shows redirect information, URL, and click history.
 */
export function RedirectPage({ redirectId }: { redirectId: string }) {
  const { formatMessage, labels } = useMessages();

  return (
    <RedirectProvider redirectId={redirectId}>
      <Grid width="100%" height="100%">
        <Column margin="2">
          <PageBody gap>
            <RedirectHeader />
            <Panel>
              <Tabs>
                <TabList>
                  <Tab id="details">{formatMessage(labels.details)}</Tab>
                  <Tab id="clicks">{formatMessage(labels.clicks)}</Tab>
                </TabList>
                <TabPanel id="details">
                  <RedirectDetails />
                </TabPanel>
                <TabPanel id="clicks">
                  <RedirectClicks />
                </TabPanel>
              </Tabs>
            </Panel>
          </PageBody>
        </Column>
      </Grid>
    </RedirectProvider>
  );
}
