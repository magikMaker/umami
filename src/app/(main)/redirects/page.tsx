import type { Metadata } from 'next';
import { RedirectsPage } from './RedirectsPage';

export default function () {
  return <RedirectsPage />;
}

export const metadata: Metadata = {
  title: 'Redirects',
};
