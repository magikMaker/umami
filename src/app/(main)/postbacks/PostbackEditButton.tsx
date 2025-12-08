import { useMessages } from '@/components/hooks';
import { Edit } from '@/components/icons';
import { DialogButton } from '@/components/input/DialogButton';
import { PostbackEditForm } from './PostbackEditForm';

/**
 * Button to edit an existing postback endpoint.
 * Opens a modal with the postback edit form.
 */
export function PostbackEditButton({ postbackId }: { postbackId: string }) {
  const { formatMessage, labels } = useMessages();

  return (
    <DialogButton icon={<Edit />} title={formatMessage(labels.edit)} variant="quiet" width="600px">
      {({ close }) => {
        return <PostbackEditForm postbackId={postbackId} onClose={close} />;
      }}
    </DialogButton>
  );
}
