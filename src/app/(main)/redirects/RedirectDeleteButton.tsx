'use client';
import { Button, Column, Dialog, DialogTrigger, Icon, Modal, Row, Text } from '@umami/react-zen';
import { useRouter } from 'next/navigation';
import { FormattedMessage } from 'react-intl';
import { useMessages } from '@/components/hooks';
import { useDeleteQuery } from '@/components/hooks/queries/useDeleteQuery';
import { Trash } from '@/components/icons';

/**
 * Delete button with confirmation dialog for redirects.
 */
export function RedirectDeleteButton({ redirectId, name }: { redirectId: string; name: string }) {
  const { formatMessage, labels, messages } = useMessages();
  const router = useRouter();

  const { mutateAsync, isPending, toast } = useDeleteQuery(`/redirects/${redirectId}`);

  const handleDelete = async (close: () => void) => {
    await mutateAsync(undefined, {
      onSuccess: () => {
        toast(formatMessage(messages.deleted));
        close();
        router.push('/redirects');
      },
    });
  };

  return (
    <DialogTrigger>
      <Button variant="danger">
        <Icon>
          <Trash />
        </Icon>
        {formatMessage(labels.delete)}
      </Button>
      <Dialog>
        <Modal title={formatMessage(labels.deleteRedirect)} width="400px">
          {({ close }) => (
            <Column gap="4">
              <Text>
                <FormattedMessage
                  {...messages.confirmDelete}
                  values={{ target: <b key="target">{name}</b> }}
                />
              </Text>
              <Row justifyContent="flex-end" gap="2">
                <Button onPress={close}>{formatMessage(labels.cancel)}</Button>
                <Button variant="danger" isDisabled={isPending} onPress={() => handleDelete(close)}>
                  {formatMessage(labels.delete)}
                </Button>
              </Row>
            </Column>
          )}
        </Modal>
      </Dialog>
    </DialogTrigger>
  );
}
