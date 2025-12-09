/**
 * Request parsing utilities for postback ingestion.
 * Handles various input formats: JSON, XML, form-urlencoded, query params.
 */

export interface ParsedRequest {
  method: string;
  query: Record<string, unknown>;
  headers: Record<string, string>;
  body: Record<string, unknown> | null;
  rawBody: string | null;
  contentType: string | null;
}

/**
 * Parses an incoming postback request based on configuration.
 * Supports auto-detection or explicit format specification.
 */
export async function parsePostbackRequest(
  request: Request,
  config: Record<string, unknown>,
): Promise<ParsedRequest> {
  const url = new URL(request.url);
  const method = request.method;
  const contentType = request.headers.get('content-type');

  // Parse query string
  const query: Record<string, unknown> = {};
  url.searchParams.forEach((value, key) => {
    query[key] = value;
  });

  // Parse headers
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });

  // Parse body based on content type
  let body: Record<string, unknown> | null = null;
  let rawBody: string | null = null;

  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    try {
      rawBody = await request.clone().text();

      const inputFormat = config.inputFormat || 'auto';
      const effectiveContentType = inputFormat === 'auto' ? contentType : inputFormat;

      if (effectiveContentType?.includes('application/json')) {
        body = JSON.parse(rawBody);
      } else if (
        effectiveContentType?.includes('application/xml') ||
        effectiveContentType?.includes('text/xml')
      ) {
        // XML parsing - for now, store as raw
        // TODO: Add fast-xml-parser if needed
        body = { _xml: rawBody };
      } else if (effectiveContentType?.includes('x-www-form-urlencoded')) {
        body = Object.fromEntries(new URLSearchParams(rawBody));
      } else if (rawBody) {
        // Try JSON first
        try {
          body = JSON.parse(rawBody);
        } catch {
          // Try form-urlencoded
          try {
            body = Object.fromEntries(new URLSearchParams(rawBody));
          } catch {
            body = { raw: rawBody };
          }
        }
      }
    } catch (e) {
      console.error('Body parse error:', e);
    }
  }

  return {
    method,
    query,
    headers,
    body,
    rawBody,
    contentType,
  };
}

/**
 * Extracts a value from parsed request data using source and path.
 * Supports dot notation for nested paths (e.g., "data.user.id").
 */
export function extractValue(
  data: ParsedRequest,
  source: 'body' | 'query' | 'header' | 'path',
  path: string,
): unknown {
  let obj: Record<string, unknown>;

  switch (source) {
    case 'body':
      obj = data.body || {};
      break;
    case 'query':
      obj = data.query;
      break;
    case 'header':
      obj = data.headers as Record<string, unknown>;
      break;
    default:
      return undefined;
  }

  // Support dot notation: "data.user.id"
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
