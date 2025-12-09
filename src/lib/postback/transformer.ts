import { extractValue, type ParsedRequest } from './parser';

/**
 * Field transformation functions.
 * Transforms values during field mapping.
 */
const transformers: Record<string, (value: unknown) => unknown> = {
  // Convert to string
  toString: (value: unknown) => String(value),

  // Convert to number
  toNumber: (value: unknown) => {
    const num = Number(value);
    return Number.isNaN(num) ? 0 : num;
  },

  // Convert to float with 2 decimal places
  toFloat: (value: unknown) => {
    const num = parseFloat(String(value));
    return Number.isNaN(num) ? 0 : parseFloat(num.toFixed(2));
  },

  // Convert to boolean
  toBoolean: (value: unknown) => {
    if (typeof value === 'boolean') return value;
    const str = String(value).toLowerCase();
    return str === 'true' || str === '1' || str === 'yes';
  },

  // Convert to lowercase
  toLowerCase: (value: unknown) => String(value).toLowerCase(),

  // Convert to uppercase
  toUpperCase: (value: unknown) => String(value).toUpperCase(),

  // Trim whitespace
  trim: (value: unknown) => String(value).trim(),

  // Parse JSON string
  parseJson: (value: unknown) => {
    try {
      return JSON.parse(String(value));
    } catch {
      return value;
    }
  },

  // Convert timestamp (seconds) to Date
  timestampToDate: (value: unknown) => {
    const timestamp = Number(value);
    return Number.isNaN(timestamp) ? null : new Date(timestamp * 1000);
  },

  // Convert timestamp (milliseconds) to Date
  timestampMsToDate: (value: unknown) => {
    const timestamp = Number(value);
    return Number.isNaN(timestamp) ? null : new Date(timestamp);
  },

  // Extract domain from URL
  extractDomain: (value: unknown) => {
    try {
      const url = new URL(String(value));
      return url.hostname;
    } catch {
      return value;
    }
  },

  // Extract path from URL
  extractPath: (value: unknown) => {
    try {
      const url = new URL(String(value));
      return url.pathname;
    } catch {
      return value;
    }
  },
};

/**
 * Transforms parsed request data according to field mapping configuration.
 * Maps fields from request to event data with optional transformations.
 */
export function transformFields(
  parsed: ParsedRequest,
  config: Record<string, unknown>,
): Record<string, unknown> {
  const fieldMapping = config.fieldMapping as
    | Array<{
        source: 'body' | 'query' | 'header' | 'path';
        sourcePath: string;
        targetField: string;
        transform?: string;
        defaultValue?: unknown;
      }>
    | undefined;

  if (!fieldMapping || !Array.isArray(fieldMapping)) {
    // No mapping - merge query and body
    return { ...parsed.query, ...(parsed.body || {}) };
  }

  const result: Record<string, unknown> = {};

  for (const mapping of fieldMapping) {
    const { source, sourcePath, targetField, transform, defaultValue } = mapping;

    // Extract value from source
    let value = extractValue(parsed, source, sourcePath);

    // Use default if value is undefined
    if (value === undefined && defaultValue !== undefined) {
      value = defaultValue;
    }

    // Apply transformation if specified
    if (value !== undefined && transform && transformers[transform]) {
      try {
        value = transformers[transform](value);
      } catch (e) {
        console.error(`Transform error for ${targetField}: ${e}`);
      }
    }

    // Only set if value is defined
    if (value !== undefined) {
      result[targetField] = value;
    }
  }

  return result;
}

/**
 * Extracts revenue data from transformed fields.
 * Returns revenue and currency if configured.
 */
export function extractRevenue(
  data: Record<string, unknown>,
  config: Record<string, unknown>,
): { revenue?: number; currency?: string } | null {
  const eventConfig = config.eventConfig as
    | {
        recordRevenue?: boolean;
        revenueField?: string;
        currencyField?: string;
      }
    | undefined;

  if (!eventConfig?.recordRevenue) {
    return null;
  }

  const revenueField = eventConfig.revenueField || 'revenue';
  const currencyField = eventConfig.currencyField || 'currency';

  const revenue = Number(data[revenueField]);
  const currency = (data[currencyField] as string) || 'USD';

  if (Number.isNaN(revenue) || revenue <= 0) {
    return null;
  }

  return { revenue, currency };
}
