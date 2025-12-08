import { useMessages } from '@/components/hooks';
import { Plus } from '@/components/icons';
import { DialogButton } from '@/components/input/DialogButton';
import { PostbackEditForm } from './PostbackEditForm';

/**
 * Button to create a new postback endpoint.
 * Opens a modal with the postback creation form.
 */
export function PostbackAddButton({ teamId }: { teamId?: string }) {
  const { formatMessage, labels } = useMessages();

  return (
    <DialogButton
      icon={<Plus />}
      label={formatMessage(labels.addPostback)}
      variant="primary"
      width="600px"
    >
      {({ close }) => <PostbackEditForm teamId={teamId} onClose={close} />}
    </DialogButton>
  );
}
