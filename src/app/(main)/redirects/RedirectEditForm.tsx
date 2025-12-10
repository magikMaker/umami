'use client';
import {
  Button,
  Form,
  FormField,
  FormSubmitButton,
  Row,
  Text,
  TextField,
  Toggle,
} from '@umami/react-zen';
import { useMessages } from '@/components/hooks';
import { useRedirectQuery } from '@/components/hooks/queries/useRedirectQuery';
import { useUpdateQuery } from '@/components/hooks/queries/useUpdateQuery';
import { WebsiteSelect } from '@/components/input/WebsiteSelect';

/**
 * Form for creating or editing a redirect.
 */
export function RedirectEditForm({
  redirectId,
  onSave,
  onClose,
}: {
  redirectId?: string;
  onSave?: () => void;
  onClose?: () => void;
}) {
  const { formatMessage, labels, messages, getErrorMessage } = useMessages();
  const { data } = useRedirectQuery(redirectId || '');

  const { mutateAsync, error, isPending, toast } = useUpdateQuery(
    redirectId ? `/redirects/${redirectId}` : '/redirects',
    { id: redirectId },
  );

  const handleSubmit = async (formData: Record<string, unknown>) => {
    // Parse param config if provided
    let paramConfig = null;
    if (formData.clickIdParam) {
      paramConfig = {
        clickIdParam: formData.clickIdParam as string,
      };
    }

    const submitData = {
      name: formData.name,
      slug: formData.slug,
      targetUrl: formData.targetUrl,
      description: formData.description,
      websiteId: formData.websiteId,
      isActive: formData.isActive,
      paramConfig,
    };

    await mutateAsync(submitData, {
      onSuccess: () => {
        toast(formatMessage(messages.saved));
        onSave?.();
      },
    });
  };

  const defaultValues = {
    isActive: true,
    ...data,
    clickIdParam: data?.paramConfig?.clickIdParam || '',
  };

  return (
    <Form onSubmit={handleSubmit} error={getErrorMessage(error)} defaultValues={defaultValues}>
      <FormField
        label={formatMessage(labels.name)}
        name="name"
        rules={{ required: formatMessage(labels.required) }}
      >
        <TextField autoComplete="off" placeholder="My Ad Campaign" />
      </FormField>

      <FormField
        label={formatMessage(labels.slug)}
        name="slug"
        description="Leave empty to auto-generate. Used in URL: /r/[slug]"
      >
        <TextField autoComplete="off" placeholder="my-campaign" />
      </FormField>

      <FormField
        label="Target URL"
        name="targetUrl"
        rules={{ required: formatMessage(labels.required) }}
      >
        <TextField autoComplete="off" placeholder="https://affiliate.example.com/offer" />
      </FormField>

      <FormField label={formatMessage(labels.description)} name="description">
        <TextField autoComplete="off" placeholder="Campaign description" />
      </FormField>

      {!redirectId && (
        <FormField
          label={formatMessage(labels.website)}
          name="websiteId"
          rules={{ required: formatMessage(labels.required) }}
        >
          <WebsiteSelect />
        </FormField>
      )}

      <FormField
        label="Click ID Parameter"
        name="clickIdParam"
        description="The query parameter containing the external click ID (e.g., 'click_id')"
      >
        <TextField autoComplete="off" placeholder="click_id" />
      </FormField>

      <Text size="sm" type="muted" style={{ marginTop: '8px' }}>
        All query parameters will be captured and passed through to the target URL. Advanced
        parameter configuration can be done after creation.
      </Text>

      {redirectId && (
        <FormField label={formatMessage(labels.active)} name="isActive">
          <Toggle />
        </FormField>
      )}

      <Row justifyContent="flex-end" paddingTop="3" gap="3">
        {onClose && (
          <Button isDisabled={isPending} onPress={onClose}>
            {formatMessage(labels.cancel)}
          </Button>
        )}
        <FormSubmitButton isDisabled={false}>{formatMessage(labels.save)}</FormSubmitButton>
      </Row>
    </Form>
  );
}
