import type { Metadata } from 'next';
import { RedirectPage } from './RedirectPage';

export default async function ({ params }: { params: { redirectId: string } }) {
  const { redirectId } = await params;

  return <RedirectPage redirectId={redirectId} />;
}

export const metadata: Metadata = {
  title: 'Redirect',
};
