'use client';
import { Column, Row, Text } from '@umami/react-zen';
import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { Tabs } from '@/components/common/Tabs';
import { formatRelayPayload } from '@/lib/postback/relayFormatter';
import { parseWithTemplate } from '@/lib/postback/templateParser';
import { getReceiveTemplate, getRelayTemplate } from '@/lib/postback/templates';

/**
 * Request data structure from the API.
 */
interface RequestData {
  id: string;
  method: string;
  path: string;
  query: Record<string, unknown>;
  headers: Record<string, string>;
  body: Record<string, unknown> | null;
  bodyRaw: string | null;
  clientIp: string | null;
  contentType: string | null;
  userAgent: string | null;
  parsedFields: Record<string, unknown> | null;
  validation: Record<string, unknown> | null;
  relayResult: Record<string, unknown> | null;
  status: string;
  createdAt: string;
}

/**
 * RequestPreview shows the full processing pipeline for a postback request.
 * Displays: Raw Request → Validation → Parsed Fields → Relay Preview
 */
export function RequestPreview({
  request,
  receiveTemplateId,
  relayTemplateId,
}: {
  request: RequestData;
  endpointId: string;
  receiveTemplateId?: string | null;
  relayTemplateId?: string | null;
}) {
  const receiveTemplate = receiveTemplateId ? getReceiveTemplate(receiveTemplateId) : null;
  const relayTemplate = relayTemplateId ? getRelayTemplate(relayTemplateId) : null;

  // Parse request with template if available
  const parsed = parseWithTemplate(request, receiveTemplate);
  const relayPreview = relayTemplate ? formatRelayPayload(parsed.fields, relayTemplate, {}) : null;

  const tabs = [
    {
      value: 'raw',
      label: 'Raw Request',
      content: <RawRequestTab request={request} />,
    },
    {
      value: 'validation',
      label: 'Validation',
      content: (
        <ValidationTab
          validation={request.validation || parsed.validation}
          template={receiveTemplate}
        />
      ),
    },
    {
      value: 'parsed',
      label: 'Parsed Fields',
      content: (
        <ParsedFieldsTab
          fields={request.parsedFields || parsed.fields}
          template={receiveTemplate}
        />
      ),
    },
    {
      value: 'relay',
      label: 'Relay Preview',
      content: (
        <RelayPreviewTab
          relayResult={request.relayResult}
          relayPreview={relayPreview}
          template={relayTemplate}
        />
      ),
    },
  ];

  return (
    <Column gap="4" padding="4">
      <Row gap="2" alignItems="center">
        <Badge color="blue">{request.method}</Badge>
        <Text>{request.path}</Text>
        <Badge color={request.status === 'valid' ? 'green' : 'gray'} variant="outline">
          {request.status}
        </Badge>
      </Row>
      <Tabs items={tabs} />
    </Column>
  );
}

/**
 * Raw request tab showing headers, query params, and body.
 */
function RawRequestTab({ request }: { request: RequestData }) {
  return (
    <Column gap="4">
      <Section title="Headers">
        <JsonBlock data={request.headers} />
      </Section>
      <Section title="Query Parameters">
        <JsonBlock data={request.query} />
      </Section>
      <Section title="Body">
        {request.body ? (
          <JsonBlock data={request.body} />
        ) : request.bodyRaw ? (
          <CodeBlock content={request.bodyRaw} />
        ) : (
          <Text type="muted">No body</Text>
        )}
      </Section>
      <Section title="Client Info">
        <Row gap="4">
          <Column>
            <Text size="xs" type="muted">
              IP Address
            </Text>
            <Text size="sm">{request.clientIp || 'Unknown'}</Text>
          </Column>
          <Column>
            <Text size="xs" type="muted">
              Content Type
            </Text>
            <Text size="sm">{request.contentType || 'None'}</Text>
          </Column>
        </Row>
        {request.userAgent && (
          <Column>
            <Text size="xs" type="muted">
              User Agent
            </Text>
            <Text size="sm" style={{ wordBreak: 'break-all' }}>
              {request.userAgent}
            </Text>
          </Column>
        )}
      </Section>
    </Column>
  );
}

/**
 * Validation tab showing validation results.
 */
function ValidationTab({
  validation,
  template,
}: {
  validation: Record<string, unknown> | null;
  template: ReturnType<typeof getReceiveTemplate>;
}) {
  if (!template?.validation || template.validation.type === 'none') {
    return (
      <Card>
        <Column padding="4" alignItems="center">
          <Text type="muted">No validation configured</Text>
          <Text size="sm" type="muted">
            {template
              ? `Template "${template.name}" does not require validation`
              : 'No receive template selected'}
          </Text>
        </Column>
      </Card>
    );
  }

  const isValid = validation?.isValid === true;

  return (
    <Column gap="4">
      <Row gap="2" alignItems="center">
        <Badge color={isValid ? 'green' : 'red'}>{isValid ? '✓ Valid' : '✗ Invalid'}</Badge>
        <Text size="sm">Using {template.name} validation</Text>
      </Row>

      <Section title="Validation Details">
        <Column gap="2">
          <Row gap="4">
            <Column>
              <Text size="xs" type="muted">
                Type
              </Text>
              <Text size="sm">{template.validation.type.toUpperCase()}</Text>
            </Column>
            <Column>
              <Text size="xs" type="muted">
                Checksum Field
              </Text>
              <Text size="sm">{template.validation.checksumField}</Text>
            </Column>
          </Row>
          {validation && (
            <>
              <Row gap="4">
                <Column>
                  <Text size="xs" type="muted">
                    Expected
                  </Text>
                  <CodeBlock content={String(validation.expected || 'N/A')} />
                </Column>
                <Column>
                  <Text size="xs" type="muted">
                    Received
                  </Text>
                  <CodeBlock content={String(validation.received || 'N/A')} />
                </Column>
              </Row>
              {validation.error && (
                <Column>
                  <Text size="xs" type="muted">
                    Error
                  </Text>
                  <Text size="sm" style={{ color: 'var(--color-red)' }}>
                    {String(validation.error)}
                  </Text>
                </Column>
              )}
            </>
          )}
        </Column>
      </Section>
    </Column>
  );
}

/**
 * Parsed fields tab showing extracted data.
 */
function ParsedFieldsTab({
  fields,
  template,
}: {
  fields: Record<string, unknown> | null;
  template: ReturnType<typeof getReceiveTemplate>;
}) {
  if (!fields || Object.keys(fields).length === 0) {
    return (
      <Card>
        <Column padding="4" alignItems="center">
          <Text type="muted">No fields extracted</Text>
          <Text size="sm" type="muted">
            {template
              ? 'No matching fields found in the request'
              : 'Select a receive template to extract fields'}
          </Text>
        </Column>
      </Card>
    );
  }

  const standardFields = ['clickId', 'revenue', 'status', 'transactionId', 'currency'];
  const subIdFields = ['subId1', 'subId2', 'subId3', 'subId4', 'subId5'];
  const otherFields = Object.keys(fields).filter(
    k => !standardFields.includes(k) && !subIdFields.includes(k),
  );

  return (
    <Column gap="4">
      {template && (
        <Text size="sm" type="muted">
          Parsed using template: {template.name}
        </Text>
      )}

      <Section title="Standard Fields">
        <Row gap="4" style={{ flexWrap: 'wrap' }}>
          {standardFields.map(field => (
            <FieldDisplay key={field} name={field} value={fields[field]} />
          ))}
        </Row>
      </Section>

      <Section title="Sub IDs">
        <Row gap="4" style={{ flexWrap: 'wrap' }}>
          {subIdFields.map(field => (
            <FieldDisplay key={field} name={field} value={fields[field]} />
          ))}
        </Row>
      </Section>

      {otherFields.length > 0 && (
        <Section title="Other Fields">
          <JsonBlock data={Object.fromEntries(otherFields.map(k => [k, fields[k]]))} />
        </Section>
      )}
    </Column>
  );
}

/**
 * Relay preview tab showing what would be sent.
 */
function RelayPreviewTab({
  relayResult,
  relayPreview,
  template,
}: {
  relayResult: Record<string, unknown> | null;
  relayPreview: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body: unknown;
  } | null;
  template: ReturnType<typeof getRelayTemplate>;
}) {
  // If we have actual relay result, show that
  if (relayResult) {
    const success = relayResult.success === true;
    return (
      <Column gap="4">
        <Row gap="2" alignItems="center">
          <Badge color={success ? 'green' : 'red'}>{success ? '✓ Sent' : '✗ Failed'}</Badge>
          <Text size="sm">Relay executed</Text>
        </Row>

        <Section title="Request Sent">
          <Column gap="2">
            <Row gap="2">
              <Badge color="blue">{String(relayResult.method || 'POST')}</Badge>
              <Text size="sm" style={{ wordBreak: 'break-all' }}>
                {String(relayResult.url || '')}
              </Text>
            </Row>
            {relayResult.body && <JsonBlock data={relayResult.body as Record<string, unknown>} />}
          </Column>
        </Section>

        <Section title="Response">
          <Column gap="2">
            <Row gap="2">
              <Badge color={success ? 'green' : 'red'}>
                {String(relayResult.statusCode || 'N/A')}
              </Badge>
            </Row>
            {relayResult.responseBody && <CodeBlock content={String(relayResult.responseBody)} />}
            {relayResult.error && (
              <Text size="sm" style={{ color: 'var(--color-red)' }}>
                {String(relayResult.error)}
              </Text>
            )}
          </Column>
        </Section>
      </Column>
    );
  }

  // Otherwise show preview of what would be sent
  if (!template || !relayPreview) {
    return (
      <Card>
        <Column padding="4" alignItems="center">
          <Text type="muted">No relay configured</Text>
          <Text size="sm" type="muted">
            Configure a relay template to forward postbacks to external systems
          </Text>
        </Column>
      </Card>
    );
  }

  return (
    <Column gap="4">
      <Row gap="2" alignItems="center">
        <Badge color="yellow">Preview</Badge>
        <Text size="sm">What would be sent using {template.name}</Text>
      </Row>

      <Section title="Request">
        <Column gap="2">
          <Row gap="2">
            <Badge color="blue">{relayPreview.method}</Badge>
            <Text size="sm" style={{ wordBreak: 'break-all' }}>
              {relayPreview.url}
            </Text>
          </Row>
        </Column>
      </Section>

      <Section title="Headers">
        <JsonBlock data={relayPreview.headers} />
      </Section>

      <Section title="Body">
        <JsonBlock data={relayPreview.body as Record<string, unknown>} />
      </Section>
    </Column>
  );
}

/**
 * Section wrapper component.
 */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Column gap="2">
      <Text weight="bold" size="sm">
        {title}
      </Text>
      {children}
    </Column>
  );
}

/**
 * JSON display block.
 */
function JsonBlock({ data }: { data: Record<string, unknown> | null | undefined }) {
  if (!data || Object.keys(data).length === 0) {
    return <Text type="muted">Empty</Text>;
  }
  return (
    <pre
      style={{
        background: 'var(--base100)',
        padding: '12px',
        borderRadius: '4px',
        overflow: 'auto',
        fontSize: '12px',
        margin: 0,
      }}
    >
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

/**
 * Code block for raw text.
 */
function CodeBlock({ content }: { content: string }) {
  return (
    <pre
      style={{
        background: 'var(--base100)',
        padding: '12px',
        borderRadius: '4px',
        overflow: 'auto',
        fontSize: '12px',
        margin: 0,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-all',
      }}
    >
      {content}
    </pre>
  );
}

/**
 * Single field display.
 */
function FieldDisplay({ name, value }: { name: string; value: unknown }) {
  return (
    <Column style={{ minWidth: '120px' }}>
      <Text size="xs" type="muted">
        {name}
      </Text>
      <Text size="sm">{value !== undefined && value !== null ? String(value) : '-'}</Text>
    </Column>
  );
}
