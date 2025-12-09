/**
 * Template parser for extracting and validating postback data.
 */
import crypto from 'node:crypto';
import type { ReceiveTemplate } from './templates/types';

/**
 * Request data to parse.
 */
interface RequestData {
  method: string;
  path: string;
  query: Record<string, unknown>;
  headers: Record<string, string>;
  body: Record<string, unknown> | null;
  bodyRaw: string | null;
}

/**
 * Parsed result from template processing.
 */
export interface ParsedResult {
  isValid: boolean;
  validation: {
    isValid: boolean;
    expected?: string;
    received?: string;
    error?: string;
  } | null;
  fields: Record<string, unknown>;
}

/**
 * Gets a value from an object using dot notation path.
 */
function getValueByPath(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

/**
 * Gets a value from request data, checking query, body, and headers.
 */
function getRequestValue(request: RequestData, fieldName: string): unknown {
  // Check query params first
  if (request.query && fieldName in request.query) {
    return request.query[fieldName];
  }

  // Check body
  if (request.body && fieldName in request.body) {
    return request.body[fieldName];
  }

  // Check body with dot notation
  if (request.body) {
    const value = getValueByPath(request.body, fieldName);
    if (value !== undefined) return value;
  }

  // Check headers (case-insensitive)
  const headerKey = Object.keys(request.headers || {}).find(
    k => k.toLowerCase() === fieldName.toLowerCase(),
  );
  if (headerKey) {
    return request.headers[headerKey];
  }

  return undefined;
}

/**
 * Converts a value to the specified type.
 */
function convertType(value: unknown, type?: string): unknown {
  if (value === undefined || value === null) return value;

  switch (type) {
    case 'number': {
      const num = Number(value);
      return Number.isNaN(num) ? value : num;
    }
    case 'boolean':
      return value === 'true' || value === '1' || value === true;
    default:
      return String(value);
  }
}

/**
 * Computes a hash for validation.
 */
function computeHash(type: string, data: string, _secret?: string): string {
  switch (type) {
    case 'md5':
      return crypto.createHash('md5').update(data).digest('hex');
    case 'sha256':
      return crypto.createHash('sha256').update(data).digest('hex');
    case 'hmac-sha256':
      // For HMAC, secret is required
      return crypto
        .createHmac('sha256', _secret || '')
        .update(data)
        .digest('hex');
    default:
      return '';
  }
}

/**
 * Validates a request using template validation config.
 */
function validateRequest(
  request: RequestData,
  template: ReceiveTemplate,
  config: Record<string, unknown>,
): ParsedResult['validation'] {
  const { validation } = template;

  if (!validation || validation.type === 'none') {
    return { isValid: true };
  }

  try {
    // Get checksum from request
    const receivedChecksum = getRequestValue(request, validation.checksumField);
    if (!receivedChecksum) {
      return {
        isValid: false,
        error: `Checksum field "${validation.checksumField}" not found in request`,
      };
    }

    // Get salt/secret from config
    const salt = validation.saltConfigKey ? String(config[validation.saltConfigKey] || '') : '';

    // Build data string for hashing
    let dataToHash = '';
    if (validation.formula) {
      // Use formula template
      dataToHash = validation.formula.replace(/\{\{(\w+)\}\}/g, (_, field) => {
        if (field === 'salt') return salt;
        return String(getRequestValue(request, field) || '');
      });
    } else {
      // Concatenate salt + fields
      dataToHash =
        salt + validation.fields.map(f => String(getRequestValue(request, f) || '')).join('');
    }

    // Compute expected checksum
    const expectedChecksum = computeHash(validation.type, dataToHash, salt);

    const isValid = expectedChecksum.toLowerCase() === String(receivedChecksum).toLowerCase();

    return {
      isValid,
      expected: expectedChecksum,
      received: String(receivedChecksum),
      error: isValid ? undefined : 'Checksum mismatch',
    };
  } catch (error) {
    return {
      isValid: false,
      error: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Extracts fields from request using template field mappings.
 */
function extractFields(
  request: RequestData,
  template: ReceiveTemplate | null,
): Record<string, unknown> {
  const fields: Record<string, unknown> = {};

  if (!template) {
    // No template - extract common fields with best-effort mapping
    const commonFields = [
      'click_id',
      'clickid',
      'cid',
      'revenue',
      'payout',
      'amount',
      'status',
      'event',
      'transaction_id',
      'txn_id',
      'order_id',
      'currency',
      'sub1',
      'sub2',
      'sub3',
      'sub4',
      'sub5',
      'subid1',
      'subid2',
      'subid3',
      'subid4',
      'subid5',
    ];

    for (const field of commonFields) {
      const value = getRequestValue(request, field);
      if (value !== undefined) {
        fields[field] = value;
      }
    }

    return fields;
  }

  // Use template field mappings
  for (const mapping of template.fieldMappings) {
    const value = getRequestValue(request, mapping.source);

    if (value !== undefined) {
      fields[mapping.target] = convertType(value, mapping.type);
    } else if (mapping.default !== undefined) {
      fields[mapping.target] = mapping.default;
    }
  }

  return fields;
}

/**
 * Parses a request using a receive template.
 * Returns validation result and extracted fields.
 */
export function parseWithTemplate(
  request: RequestData,
  template: ReceiveTemplate | null,
  config: Record<string, unknown> = {},
): ParsedResult {
  // Validate if template has validation config
  const validation = template ? validateRequest(request, template, config) : null;

  // Extract fields
  const fields = extractFields(request, template);

  return {
    isValid: validation?.isValid !== false,
    validation,
    fields,
  };
}
