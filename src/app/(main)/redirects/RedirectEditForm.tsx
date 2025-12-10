'use client';
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
  Text,
  TextField,
  Toggle,
} from '@umami/react-zen';
import { useEffect, useState } from 'react';
import { useConfig, useMessages } from '@/components/hooks';
import { useRedirectQuery } from '@/components/hooks/queries/useRedirectQuery';
import { useUpdateQuery } from '@/components/hooks/queries/useUpdateQuery';
import { RefreshCw } from '@/components/icons';
import { WebsiteSelect } from '@/components/input/WebsiteSelect';
import { REDIRECTS_URL } from '@/lib/constants';
import { getRandomChars } from '@/lib/generate';

const generateSlug = () => getRandomChars(9);

/**
 * Form for creating or editing a redirect.
 */
export function RedirectEditForm({
  redirectId,
  teamId,
  onSave,
  onClose,
}: {
  redirectId?: string;
  teamId?: string;
  onSave?: () => void;
  onClose?: () => void;
}) {
  const { formatMessage, labels, messages, getErrorMessage } = useMessages();
  const { data, isLoading } = useRedirectQuery(redirectId || '');
  const { redirectsUrl } = useConfig();
  const hostUrl = redirectsUrl || REDIRECTS_URL;
  const [slug, setSlug] = useState(generateSlug());

  const { mutateAsync, error, isPending, touch, toast } = useUpdateQuery(
    redirectId ? `/redirects/${redirectId}` : '/redirects',
    { id: redirectId, teamId },
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
        touch('redirects');
        onSave?.();
        onClose?.();
      },
    });
  };

  const handleSlug = () => {
    const newSlug = generateSlug();
    setSlug(newSlug);
    return newSlug;
  };

  useEffect(() => {
    if (data) {
      setSlug(data.slug);
    }
  }, [data]);

  if (redirectId && isLoading) {
    return <Loading placement="absolute" />;
  }

  const defaultValues = {
    isActive: true,
    slug,
    ...data,
    clickIdParam: data?.paramConfig?.clickIdParam || '',
  };

  return (
    <Form onSubmit={handleSubmit} error={getErrorMessage(error)} defaultValues={defaultValues}>
      {({ setValue }) => (
        <>
          <FormField
            label={formatMessage(labels.name)}
            name="name"
            rules={{ required: formatMessage(labels.required) }}
          >
            <TextField autoComplete="off" autoFocus placeholder="My Ad Campaign" />
          </FormField>

          <FormField
            label={formatMessage(labels.destinationUrl)}
            name="targetUrl"
            rules={{ required: formatMessage(labels.required) }}
          >
            <TextField autoComplete="off" placeholder="https://affiliate.example.com/offer" />
          </FormField>

          <FormField
            name="slug"
            rules={{ required: formatMessage(labels.required) }}
            style={{ display: 'none' }}
          >
            <input type="hidden" />
          </FormField>

          <Column>
            <Label>{formatMessage(labels.redirect)}</Label>
            <Row alignItems="center" gap>
              <TextField
                value={`${hostUrl}/${slug}`}
                autoComplete="off"
                isReadOnly
                allowCopy
                style={{ width: '100%' }}
              />
              <Button
                variant="quiet"
                onPress={() => setValue('slug', handleSlug(), { shouldDirty: true })}
              >
                <Icon>
                  <RefreshCw />
                </Icon>
              </Button>
            </Row>
          </Column>

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
            All query parameters will be captured and passed through to the target URL.
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
            <FormSubmitButton>{formatMessage(labels.save)}</FormSubmitButton>
          </Row>
        </>
      )}
    </Form>
  );
}
