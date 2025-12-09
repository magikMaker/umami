/**
 * Postback template type definitions.
 * Templates define how to parse/validate incoming postbacks and format outgoing relays.
 */

/**
 * Validation configuration for incoming postbacks.
 */
export interface ValidationConfig {
  /** Validation type */
  type: 'md5' | 'sha256' | 'hmac-sha256' | 'none';
  /** Fields to include in checksum calculation, in order */
  fields: string[];
  /** Field name containing the checksum in the request */
  checksumField: string;
  /** Config key for user-provided salt/secret */
  saltConfigKey?: string;
  /** Custom formula template for checksum calculation */
  formula?: string;
}

/**
 * Field mapping from source field to standard field name.
 */
export interface FieldMapping {
  /** Source field path (supports dot notation) */
  source: string;
  /** Target standard field name */
  target: string;
  /** Optional type conversion */
  type?: 'string' | 'number' | 'boolean';
  /** Optional default value if source is missing */
  default?: string | number | boolean;
}

/**
 * Receive template - defines how to parse and validate incoming postbacks.
 */
export interface ReceiveTemplate {
  /** Unique template identifier */
  id: string;
  /** Display name */
  name: string;
  /** Template description */
  description: string;
  /** Source/platform name (e.g., "Chaturbate", "ClickBank") */
  source: string;
  /** Documentation URL */
  docsUrl?: string;
  /** Validation configuration */
  validation?: ValidationConfig;
  /** Field mappings from source to standard fields */
  fieldMappings: FieldMapping[];
  /** Standard fields extracted by this template */
  standardFields: {
    clickId?: string;
    revenue?: string;
    status?: string;
    transactionId?: string;
    currency?: string;
    subId1?: string;
    subId2?: string;
    subId3?: string;
    subId4?: string;
    subId5?: string;
  };
  /** User-configurable settings */
  configSchema?: {
    key: string;
    label: string;
    type: 'string' | 'number';
    required?: boolean;
    description?: string;
  }[];
}

/**
 * Relay template - defines how to format outgoing postbacks to ad networks.
 */
export interface RelayTemplate {
  /** Unique template identifier */
  id: string;
  /** Display name */
  name: string;
  /** Template description */
  description: string;
  /** Destination name (e.g., "Facebook CAPI", "Google Ads") */
  destination: string;
  /** Documentation URL */
  docsUrl?: string;
  /** HTTP method to use */
  method: 'GET' | 'POST' | 'PUT';
  /** Content type / format */
  format: 'json' | 'query' | 'form';
  /** URL template (can include {{variables}}) */
  urlTemplate: string;
  /** Header templates */
  headers?: Record<string, string>;
  /** Body/payload template mapping */
  bodyTemplate: Record<string, string>;
  /** User-configurable settings */
  configSchema?: {
    key: string;
    label: string;
    type: 'string' | 'number';
    required?: boolean;
    description?: string;
  }[];
}

/**
 * Parsed/extracted data from a postback request.
 */
export interface ParsedPostback {
  /** Whether validation passed (if applicable) */
  isValid: boolean;
  /** Validation error message if failed */
  validationError?: string;
  /** Raw request data */
  raw: {
    method: string;
    path: string;
    query: Record<string, unknown>;
    headers: Record<string, string>;
    body: Record<string, unknown> | null;
    bodyRaw: string | null;
  };
  /** Extracted standard fields */
  fields: {
    clickId?: string;
    revenue?: number;
    status?: string;
    transactionId?: string;
    currency?: string;
    subId1?: string;
    subId2?: string;
    subId3?: string;
    subId4?: string;
    subId5?: string;
    [key: string]: unknown;
  };
  /** Template used for parsing (if any) */
  templateId?: string;
}

/**
 * Result of processing a relay.
 */
export interface RelayResult {
  /** Whether relay was successful */
  success: boolean;
  /** HTTP status code returned */
  statusCode?: number;
  /** Response body */
  responseBody?: string;
  /** Error message if failed */
  error?: string;
  /** What was sent */
  sentPayload: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body: string | Record<string, unknown>;
  };
}
