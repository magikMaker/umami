import {
  Button,
  Column,
  Form,
  FormField,
  FormSubmitButton,
  Icon,
  Label,
  Loading,
  Row,
  Select,
  TextField,
} from '@umami/react-zen';
import { useEffect, useState } from 'react';
import { useMessages, usePostbackQuery } from '@/components/hooks';
import { useUpdateQuery } from '@/components/hooks/queries/useUpdateQuery';
import { RefreshCw } from '@/components/icons';
import { WebsiteSelect } from '@/components/input/WebsiteSelect';
import { POSTBACKS_URL } from '@/lib/constants';
import { getRandomChars } from '@/lib/generate';
import { getReceiveTemplates } from '@/lib/postback/templates';

const generateId = () => getRandomChars(12);

/**
 * Template options for the receive template selector.
 */
const receiveTemplates = getReceiveTemplates();
const templateOptions = [
  { value: '', label: 'Custom (no template)' },
  ...receiveTemplates.map(t => ({ value: t.id, label: t.name })),
];

/**
 * Form for creating or editing a postback endpoint.
 * Includes name, slug generation, and receive template selection.
 */
export function PostbackEditForm({
  postbackId,
  teamId,
  onSave,
  onClose,
}: {
  postbackId?: string;
  teamId?: string;
  onSave?: () => void;
  onClose?: () => void;
}) {
  const { formatMessage, labels, messages, getErrorMessage } = useMessages();
  const { mutateAsync, error, isPending, touch, toast } = useUpdateQuery(
    postbackId ? `/postbacks/${postbackId}` : '/postbacks',
    {
      id: postbackId,
      teamId,
    },
  );
  const hostUrl = POSTBACKS_URL;
  const { data, isLoading } = usePostbackQuery(postbackId);
  const [slug, setSlug] = useState(generateId());

  const handleSubmit = async (formData: Record<string, unknown>) => {
    await mutateAsync(formData, {
      onSuccess: async () => {
        toast(formatMessage(messages.saved));
        touch('postbacks');
        onSave?.();
        onClose?.();
      },
    });
  };

  const handleSlug = () => {
    const newSlug = generateId();
    setSlug(newSlug);
    return newSlug;
  };

  useEffect(() => {
    if (data) {
      setSlug(data.slug);
    }
  }, [data]);

  if (postbackId && isLoading) {
    return <Loading placement="absolute" />;
  }

  return (
    <Form
      onSubmit={handleSubmit}
      error={getErrorMessage(error)}
      defaultValues={{ slug, receiveTemplateId: '', ...data }}
    >
      {({ setValue }) => {
        return (
          <>
            <FormField
              label={formatMessage(labels.name)}
              name="name"
              rules={{ required: formatMessage(labels.required) }}
            >
              <TextField autoComplete="off" />
            </FormField>

            <FormField label={formatMessage(labels.description)} name="description">
              <TextField autoComplete="off" />
            </FormField>

            {!postbackId && (
              <FormField
                label={formatMessage(labels.website)}
                name="websiteId"
                rules={{ required: formatMessage(labels.required) }}
              >
                <WebsiteSelect teamId={teamId} />
              </FormField>
            )}

            <FormField
              name="slug"
              rules={{
                required: formatMessage(labels.required),
              }}
              style={{ display: 'none' }}
            >
              <input type="hidden" />
            </FormField>

            <Column>
              <Label>{formatMessage(labels.endpointUrl)}</Label>
              <Row alignItems="center" gap>
                <TextField
                  value={`${hostUrl}/${slug}`}
                  autoComplete="off"
                  isReadOnly
                  allowCopy
                  style={{ width: '100%' }}
                />
                <Button onPress={() => setValue('slug', handleSlug(), { shouldDirty: true })}>
                  <Icon>
                    <RefreshCw />
                  </Icon>
                </Button>
              </Row>
            </Column>

            <FormField label="Receive Template" name="receiveTemplateId">
              <Select items={templateOptions} />
            </FormField>

            <Row justifyContent="flex-end" paddingTop="3" gap="3">
              {onClose && (
                <Button isDisabled={isPending} onPress={onClose}>
                  {formatMessage(labels.cancel)}
                </Button>
              )}
              <FormSubmitButton isDisabled={false}>{formatMessage(labels.save)}</FormSubmitButton>
            </Row>
          </>
        );
      }}
    </Form>
  );
}
