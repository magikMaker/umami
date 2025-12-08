import type { Metadata } from 'next';
import { PostbacksPage } from './PostbacksPage';

export default function () {
  return <PostbacksPage />;
}

export const metadata: Metadata = {
  title: 'Postbacks',
};
