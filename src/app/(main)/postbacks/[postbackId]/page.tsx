import type { Metadata } from 'next';
import { PostbackPage } from './PostbackPage';

export default async function ({ params }: { params: { postbackId: string } }) {
  const { postbackId } = await params;

  return <PostbackPage postbackId={postbackId} />;
}

export const metadata: Metadata = {
  title: 'Postback',
};
