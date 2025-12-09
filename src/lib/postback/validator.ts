import { hash } from '@/lib/crypto';
import type { ParsedRequest } from './parser';

/**
 * Validation result for postback requests.
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
  details?: Record<string, unknown>;
}

/**
 * Validates a postback request based on endpoint configuration.
 * Supports multiple validation types: checksum, HMAC, API key, IP
 * allowlist.
 */
export async function validatePostback(
  parsed: ParsedRequest,
  config: Record<string, unknown>,
): Promise<ValidationResult> {
  const validation = config.validation as
    | {
        type: string;
        config: Record<string, unknown>;
      }
    | undefined;

  if (!validation || validation.type === 'none') {
    return { valid: true };
  }

  switch (validation.type) {
    case 'checksum':
      return validateChecksum(parsed, validation.config);
    case 'hmac':
      return validateHmac(parsed, validation.config);
    case 'apiKey':
      return validateApiKey(parsed, validation.config);
    case 'ipAllowlist':
      return validateIpAllowlist(parsed, validation.config);
    default:
      return { valid: true };
  }
}

/**
 * Validates checksum-based requests.
 * Expects a checksum parameter that matches a hash of other parameters.
 */
function validateChecksum(
  parsed: ParsedRequest,
  config: Record<string, unknown>,
): ValidationResult {
  const checksumField = (config.checksumField as string) || 'checksum';
  const secret = config.secret as string;
  const fields = (config.fields as string[]) || [];

  if (!secret) {
    return {
      valid: false,
      error: 'Checksum validation requires secret',
    };
  }

  const allData = { ...parsed.query, ...parsed.body };
  const receivedChecksum = allData[checksumField];

  if (!receivedChecksum) {
    return {
      valid: false,
      error: `Missing ${checksumField} parameter`,
    };
  }

  // Build string to hash
  const parts: string[] = [];
  for (const field of fields) {
    const value = allData[field];
    if (value !== undefined) {
      parts.push(String(value));
    }
  }
  parts.push(secret);

  const expectedChecksum = hash(...parts);

  if (receivedChecksum !== expectedChecksum) {
    return {
      valid: false,
      error: 'Checksum validation failed',
    };
  }

  return { valid: true };
}

/**
 * Validates HMAC-signed requests.
 * Expects an HMAC signature in headers or parameters.
 */
function validateHmac(parsed: ParsedRequest, config: Record<string, unknown>): ValidationResult {
  const signatureField = (config.signatureField as string) || 'signature';
  const secret = config.secret as string;
  const signatureLocation = (config.signatureLocation as string) || 'header';

  if (!secret) {
    return {
      valid: false,
      error: 'HMAC validation requires secret',
    };
  }

  const signature =
    signatureLocation === 'header'
      ? parsed.headers[signatureField.toLowerCase()]
      : (parsed.query[signatureField] as string) || (parsed.body?.[signatureField] as string);

  if (!signature) {
    return {
      valid: false,
      error: `Missing ${signatureField}`,
    };
  }

  // Calculate expected HMAC
  const payload = parsed.rawBody || JSON.stringify(parsed.query);
  const expectedSignature = hash(payload, secret);

  if (signature !== expectedSignature) {
    return {
      valid: false,
      error: 'HMAC validation failed',
    };
  }

  return { valid: true };
}

/**
 * Validates API key in request.
 * Checks for API key in headers or query parameters.
 */
function validateApiKey(parsed: ParsedRequest, config: Record<string, unknown>): ValidationResult {
  const apiKeyField = (config.apiKeyField as string) || 'api_key';
  const apiKey = config.apiKey as string;
  const apiKeyLocation = (config.apiKeyLocation as string) || 'header';

  if (!apiKey) {
    return {
      valid: false,
      error: 'API key validation requires apiKey',
    };
  }

  const receivedKey =
    apiKeyLocation === 'header'
      ? parsed.headers[apiKeyField.toLowerCase()] ||
        parsed.headers.authorization?.replace(/^Bearer\s+/i, '')
      : (parsed.query[apiKeyField] as string) || (parsed.body?.[apiKeyField] as string);

  if (!receivedKey) {
    return {
      valid: false,
      error: `Missing ${apiKeyField}`,
    };
  }

  if (receivedKey !== apiKey) {
    return {
      valid: false,
      error: 'Invalid API key',
    };
  }

  return { valid: true };
}

/**
 * Validates request IP against allowlist.
 * Checks if the request IP is in the configured allowlist.
 */
function validateIpAllowlist(
  parsed: ParsedRequest,
  config: Record<string, unknown>,
): ValidationResult {
  const allowedIps = (config.allowedIps as string[]) || [];
  const clientIp =
    parsed.headers['x-forwarded-for']?.split(',')[0].trim() || parsed.headers['x-real-ip'] || '';

  if (!clientIp) {
    return {
      valid: false,
      error: 'Could not determine client IP',
    };
  }

  if (!allowedIps.includes(clientIp)) {
    return {
      valid: false,
      error: 'IP not in allowlist',
      details: { clientIp },
    };
  }

  return { valid: true };
}
