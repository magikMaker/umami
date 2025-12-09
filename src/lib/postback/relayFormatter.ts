/**
 * Relay formatter for transforming postback data to relay format.
 */
import type { RelayTemplate } from './templates/types';

/**
 * Result of formatting a relay payload.
 */
export interface FormattedRelay {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: unknown;
}

/**
 * Replaces template variables in a string.
 * Supports: {{field}}, {{field|default:value}}, {{field|number}}
 */
function replaceTemplateVars(
  template: string,
  fields: Record<string, unknown>,
  config: Record<string, unknown>,
): string {
  return template.replace(/\{\{(\w+)(?:\|(\w+)(?::([^}]+))?)?\}\}/g, (_, field, modifier, arg) => {
    // Check fields first, then config
    let value = fields[field] ?? config[field];

    if (modifier === 'default' && (value === undefined || value === null || value === '')) {
      value = arg;
    }

    if (modifier === 'number') {
      const num = Number(value);
      return Number.isNaN(num) ? '0' : String(num);
    }

    return value !== undefined && value !== null ? String(value) : '';
  });
}

/**
 * Recursively processes an object/array template.
 */
function processTemplate(
  template: unknown,
  fields: Record<string, unknown>,
  config: Record<string, unknown>,
): unknown {
  if (typeof template === 'string') {
    return replaceTemplateVars(template, fields, config);
  }

  if (Array.isArray(template)) {
    return template.map(item => processTemplate(item, fields, config));
  }

  if (template !== null && typeof template === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(template)) {
      result[key] = processTemplate(value, fields, config);
    }
    return result;
  }

  return template;
}

/**
 * Formats a relay payload using a template and extracted fields.
 */
export function formatRelayPayload(
  fields: Record<string, unknown>,
  template: RelayTemplate,
  config: Record<string, unknown>,
): FormattedRelay {
  // Add timestamp if not present
  const enrichedFields = {
    ...fields,
    timestamp: fields.timestamp || Math.floor(Date.now() / 1000),
  };

  // Process URL template
  const url = replaceTemplateVars(template.urlTemplate, enrichedFields, config);

  // Process headers
  const headers: Record<string, string> = {};
  if (template.headers) {
    for (const [key, value] of Object.entries(template.headers)) {
      headers[key] = replaceTemplateVars(value, enrichedFields, config);
    }
  }

  // Process body template
  const body = processTemplate(template.bodyTemplate, enrichedFields, config);

  return {
    url,
    method: template.method,
    headers,
    body,
  };
}

/**
 * Encodes body based on format type.
 */
export function encodeBody(
  body: unknown,
  format: 'json' | 'query' | 'form',
): { contentType: string; data: string } {
  switch (format) {
    case 'json':
      return {
        contentType: 'application/json',
        data: JSON.stringify(body),
      };

    case 'query': {
      const params = new URLSearchParams();
      if (body && typeof body === 'object') {
        for (const [key, value] of Object.entries(body)) {
          if (value !== undefined && value !== null) {
            params.append(key, String(value));
          }
        }
      }
      return {
        contentType: 'application/x-www-form-urlencoded',
        data: params.toString(),
      };
    }

    case 'form': {
      const formData = new URLSearchParams();
      if (body && typeof body === 'object') {
        for (const [key, value] of Object.entries(body)) {
          if (value !== undefined && value !== null) {
            formData.append(key, String(value));
          }
        }
      }
      return {
        contentType: 'application/x-www-form-urlencoded',
        data: formData.toString(),
      };
    }

    default:
      return {
        contentType: 'application/json',
        data: JSON.stringify(body),
      };
  }
}
