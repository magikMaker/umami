import { useMessages } from '@/components/hooks';
import { Edit } from '@/components/icons';
import { DialogButton } from '@/components/input/DialogButton';
import { RedirectEditForm } from './RedirectEditForm';

export function RedirectEditButton({ redirectId }: { redirectId: string }) {
  const { formatMessage, labels } = useMessages();

  return (
    <DialogButton
      icon={<Edit />}
      title={formatMessage(labels.redirect)}
      variant="quiet"
      width="600px"
    >
      {({ close }) => {
        return <RedirectEditForm redirectId={redirectId} onClose={close} />;
      }}
    </DialogButton>
  );
}
