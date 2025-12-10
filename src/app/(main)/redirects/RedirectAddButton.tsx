import { useMessages } from '@/components/hooks';
import { Plus } from '@/components/icons';
import { DialogButton } from '@/components/input/DialogButton';
import { RedirectEditForm } from './RedirectEditForm';

export function RedirectAddButton({ teamId }: { teamId?: string }) {
  const { formatMessage, labels } = useMessages();

  return (
    <DialogButton
      icon={<Plus />}
      label={formatMessage(labels.createRedirect)}
      variant="primary"
      width="600px"
    >
      {({ close }) => <RedirectEditForm teamId={teamId} onClose={close} />}
    </DialogButton>
  );
}
