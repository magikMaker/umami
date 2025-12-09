/**
 * Relay execution engine for postback forwarding.
 * Handles outbound relay to external destinations with:
 * - Format transformation (JSON, query string, form data)
 * - Field mapping
 * - Conditional routing
 * - Retry logic with exponential backoff
 * - Relay logging
 */

import { RELAY_STATUS } from '@/lib/constants';
import { createRelayLog } from '@/queries/prisma';
import type { ParsedRequest } from './parser';

/**
 * Relay configuration interface.
 */
interface RelayConfig {
  id: string;
  name: string;
  targetUrl: string;
  method: string;
  format: string;
  mapping: Record<string, unknown>;
  headers: Record<string, string> | null;
  conditions: Record<string, unknown> | null;
  retryConfig: RetryConfig | null;
}

/**
 * Retry configuration interface.
 */
interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

/**
 * Default retry configuration.
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
};

/**
 * Relays transformed data to configured targets.
 * Executes asynchronously (fire and forget).
 */
export async function relayToTargets(
  relays: RelayConfig[],
  originalRequest: ParsedRequest,
  transformedData: Record<string, unknown>,
  requestId?: string,
): Promise<void> {
  const promises = relays.map(relay =>
    executeRelay(relay, originalRequest, transformedData, requestId),
  );

  await Promise.allSettled(promises);
}

/**
 * Executes a single relay with retry logic.
 */
async function executeRelay(
  relay: RelayConfig,
  _originalRequest: ParsedRequest,
  transformedData: Record<string, unknown>,
  requestId?: string,
): Promise<void> {
  // Check conditions
  if (relay.conditions && !evaluateConditions(relay.conditions, transformedData)) {
    return;
  }

  const retryConfig = relay.retryConfig || DEFAULT_RETRY_CONFIG;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
    try {
      const result = await sendRelayRequest(relay, transformedData);

      // Log success
      if (requestId) {
        await createRelayLog({
          relay: { connect: { id: relay.id } },
          requestId,
          status: RELAY_STATUS.success,
          statusCode: result.status,
          requestBody: result.requestBody,
          responseBody: result.responseBody,
          duration: result.duration,
          attempt,
        });
      }

      return;
    } catch (error) {
      lastError = error as Error;

      // Log retry attempt
      if (requestId) {
        await createRelayLog({
          relay: { connect: { id: relay.id } },
          requestId,
          status: attempt < retryConfig.maxAttempts ? RELAY_STATUS.retrying : RELAY_STATUS.failed,
          error: lastError.message,
          attempt,
        });
      }

      // Wait before retry with exponential backoff
      if (attempt < retryConfig.maxAttempts) {
        const delay = Math.min(
          retryConfig.initialDelayMs * retryConfig.backoffMultiplier ** (attempt - 1),
          retryConfig.maxDelayMs,
        );
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  console.error(`Relay ${relay.name} failed after ${retryConfig.maxAttempts} attempts:`, lastError);
}

/**
 * Sends the actual HTTP request to the relay target.
 */
async function sendRelayRequest(
  relay: RelayConfig,
  data: Record<string, unknown>,
): Promise<{
  status: number;
  requestBody: Record<string, unknown>;
  responseBody: string;
  duration: number;
}> {
  const startTime = Date.now();

  // Apply field mapping
  const mappedData = applyMapping(data, relay.mapping);

  // Build request based on format
  let url = relay.targetUrl;
  let body: string | undefined;
  let contentType: string;

  switch (relay.format) {
    case 'query':
      url = buildQueryUrl(relay.targetUrl, mappedData);
      contentType = 'text/plain';
      break;

    case 'form':
      body = new URLSearchParams(
        Object.entries(mappedData).map(([k, v]) => [k, String(v)]),
      ).toString();
      contentType = 'application/x-www-form-urlencoded';
      break;

    default:
      body = JSON.stringify(mappedData);
      contentType = 'application/json';
      break;
  }

  // Build headers
  const headers: Record<string, string> = {
    'Content-Type': contentType,
    'User-Agent': 'Umami-Postback-Relay/1.0',
    ...relay.headers,
  };

  // Send request
  const response = await fetch(url, {
    method: relay.method,
    headers,
    body: ['GET', 'HEAD'].includes(relay.method) ? undefined : body,
  });

  const responseBody = await response.text();
  const duration = Date.now() - startTime;

  if (!response.ok) {
    throw new Error(`Relay failed: ${response.status} ${responseBody}`);
  }

  return {
    status: response.status,
    requestBody: mappedData,
    responseBody,
    duration,
  };
}

/**
 * Builds a URL with query parameters.
 */
function buildQueryUrl(baseUrl: string, data: Record<string, unknown>): string {
  const url = new URL(baseUrl);

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

/**
 * Applies field mapping to transform data.
 */
function applyMapping(
  data: Record<string, unknown>,
  mapping: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  const fieldMappings =
    (mapping.fields as Array<{
      source: string;
      target: string;
      transform?: string;
      defaultValue?: unknown;
      staticValue?: unknown;
    }>) || [];

  for (const field of fieldMappings) {
    let value: unknown;

    if (field.staticValue !== undefined) {
      value = field.staticValue;
    } else {
      value = getNestedValue(data, field.source);

      if (value === undefined) {
        value = field.defaultValue;
      }

      if (value !== undefined && field.transform) {
        value = applyTransform(value, field.transform);
      }
    }

    if (value !== undefined) {
      setNestedValue(result, field.target, value);
    }
  }

  return result;
}

/**
 * Gets a nested value from an object using dot notation.
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let value: unknown = obj;

  for (const part of parts) {
    if (value && typeof value === 'object') {
      value = (value as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return value;
}

/**
 * Sets a nested value in an object using dot notation.
 */
function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split('.');
  let current = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!current[part] || typeof current[part] !== 'object') {
      current[part] = {};
    }
    current = current[part] as Record<string, unknown>;
  }

  current[parts[parts.length - 1]] = value;
}

/**
 * Applies a transformation function to a value.
 */
function applyTransform(value: unknown, transform: string): unknown {
  switch (transform) {
    case 'string':
      return String(value);
    case 'number':
      return Number(value);
    case 'boolean':
      return Boolean(value);
    case 'uppercase':
      return String(value).toUpperCase();
    case 'lowercase':
      return String(value).toLowerCase();
    case 'trim':
      return String(value).trim();
    case 'round':
      return Math.round(Number(value));
    case 'floor':
      return Math.floor(Number(value));
    case 'ceil':
      return Math.ceil(Number(value));
    default:
      return value;
  }
}

/**
 * Evaluates conditions to determine if relay should execute.
 */
function evaluateConditions(
  conditions: Record<string, unknown>,
  data: Record<string, unknown>,
): boolean {
  const rules =
    (conditions.rules as Array<{
      field: string;
      operator: string;
      value: unknown;
    }>) || [];

  const logic = (conditions.logic as string) || 'and';

  if (rules.length === 0) {
    return true;
  }

  const results = rules.map(rule => evaluateRule(rule, data));

  if (logic === 'or') {
    return results.some(r => r);
  }

  return results.every(r => r);
}

/**
 * Evaluates a single condition rule.
 */
function evaluateRule(
  rule: { field: string; operator: string; value: unknown },
  data: Record<string, unknown>,
): boolean {
  const fieldValue = getNestedValue(data, rule.field);

  switch (rule.operator) {
    case 'eq':
      return fieldValue === rule.value;
    case 'neq':
      return fieldValue !== rule.value;
    case 'gt':
      return Number(fieldValue) > Number(rule.value);
    case 'gte':
      return Number(fieldValue) >= Number(rule.value);
    case 'lt':
      return Number(fieldValue) < Number(rule.value);
    case 'lte':
      return Number(fieldValue) <= Number(rule.value);
    case 'contains':
      return String(fieldValue).includes(String(rule.value));
    case 'startsWith':
      return String(fieldValue).startsWith(String(rule.value));
    case 'endsWith':
      return String(fieldValue).endsWith(String(rule.value));
    case 'exists':
      return fieldValue !== undefined && fieldValue !== null;
    case 'notExists':
      return fieldValue === undefined || fieldValue === null;
    default:
      return false;
  }
}
