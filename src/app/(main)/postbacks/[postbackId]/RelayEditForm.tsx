'use client';
import {
  Button,
  Column,
  Form,
  FormField,
  FormSubmitButton,
  Row,
  Select,
  Text,
  TextField,
  Toggle,
} from '@umami/react-zen';
import { useMessages } from '@/components/hooks';
import { useRelayQuery } from '@/components/hooks/queries/useRelayQuery';
import { useUpdateQuery } from '@/components/hooks/queries/useUpdateQuery';

/**
 * HTTP method options for relay requests.
 */
const HTTP_METHODS = [
  { value: 'GET', label: 'GET' },
  { value: 'POST', label: 'POST' },
  { value: 'PUT', label: 'PUT' },
  { value: 'PATCH', label: 'PATCH' },
  { value: 'DELETE', label: 'DELETE' },
];

/**
 * Format options for relay data transformation.
 */
const FORMATS = [
  { value: 'json', label: 'JSON' },
  { value: 'query', label: 'Query String' },
  { value: 'form', label: 'Form Data' },
];

/**
 * Parses JSON string safely, returns empty object on error.
 */
function parseJson(value: string): Record<string, unknown> {
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

/**
 * Form component for creating or editing a relay.
 * Handles relay configuration including target URL, method, format,
 * field mapping, custom headers, and active state.
 */
export function RelayEditForm({
  endpointId,
  relayId,
  onSave,
  onClose,
}: {
  endpointId: string;
  relayId?: string;
  onSave?: () => void;
  onClose?: () => void;
}) {
  const { formatMessage, labels, messages, getErrorMessage } = useMessages();
  const { data } = useRelayQuery(endpointId, relayId);

  const { mutateAsync, error, isPending, toast } = useUpdateQuery(
    relayId ? `/postbacks/${endpointId}/relays/${relayId}` : `/postbacks/${endpointId}/relays`,
    { id: relayId },
  );

  const handleSubmit = async (formData: Record<string, unknown>) => {
    // Parse JSON fields before submitting
    const submitData = {
      ...formData,
      mapping:
        typeof formData.mapping === 'string' ? parseJson(formData.mapping) : formData.mapping,
      headers:
        typeof formData.headers === 'string' ? parseJson(formData.headers) : formData.headers,
    };

    await mutateAsync(submitData, {
      onSuccess: () => {
        toast(formatMessage(messages.saved));
        onSave?.();
      },
    });
  };

  // Prepare default values with JSON stringified for text areas
  const defaultValues = {
    method: 'POST',
    format: 'json',
    isActive: true,
    mapping: '{}',
    headers: '{}',
    ...data,
    // Convert objects to JSON strings for editing
    ...(data?.mapping && { mapping: JSON.stringify(data.mapping, null, 2) }),
    ...(data?.headers && { headers: JSON.stringify(data.headers, null, 2) }),
  };

  return (
    <Form onSubmit={handleSubmit} error={getErrorMessage(error)} defaultValues={defaultValues}>
      <FormField
        label={formatMessage(labels.name)}
        name="name"
        rules={{ required: formatMessage(labels.required) }}
      >
        <TextField autoComplete="off" />
      </FormField>

      <FormField
        label="Target URL"
        name="targetUrl"
        rules={{ required: formatMessage(labels.required) }}
      >
        <TextField autoComplete="off" placeholder="https://example.com/webhook" />
      </FormField>

      <Row gap="3">
        <FormField label="Method" name="method" style={{ flex: 1 }}>
          <Select items={HTTP_METHODS} />
        </FormField>

        <FormField label="Format" name="format" style={{ flex: 1 }}>
          <Select items={FORMATS} />
        </FormField>
      </Row>

      <FormField label="Field Mapping (JSON)" name="mapping">
        <Column gap="1">
          <TextField
            asTextArea
            autoComplete="off"
            placeholder={'{\n  "output_field": "{{input_field}}"\n}'}
          />
          <Text size="xs" type="muted">
            Map incoming fields to output fields. Use {'{{field}}'} for values, {'{{field|number}}'}
            to convert to number.
          </Text>
        </Column>
      </FormField>

      <FormField label="Custom Headers (JSON)" name="headers">
        <Column gap="1">
          <TextField
            asTextArea
            autoComplete="off"
            placeholder={'{\n  "Authorization": "Bearer token"\n}'}
          />
          <Text size="xs" type="muted">
            Additional HTTP headers to send with the relay request.
          </Text>
        </Column>
      </FormField>

      <FormField label="Active" name="isActive">
        <Toggle />
      </FormField>

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
