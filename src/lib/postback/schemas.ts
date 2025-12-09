import { z } from 'zod';

/**
 * Schema for postback endpoint configuration.
 * Defines how postbacks are received, validated, and processed.
 */
export const endpointConfigSchema = z.object({
  // HTTP methods allowed for this endpoint
  allowedMethods: z
    .array(z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']))
    .default(['GET', 'POST']),

  // Input format parsing strategy
  inputFormat: z.enum(['auto', 'json', 'xml', 'form', 'query']).default('auto'),

  // Validation configuration
  validation: z
    .object({
      type: z.enum(['none', 'checksum', 'hmac', 'apiKey', 'ipAllowlist']),
      config: z.record(z.unknown()),
    })
    .optional(),

  // Field mapping configuration - maps incoming fields to event data
  fieldMapping: z
    .array(
      z.object({
        source: z.enum(['body', 'query', 'header', 'path']),
        sourcePath: z.string(),
        targetField: z.string(),
        transform: z.string().optional(),
        defaultValue: z.unknown().optional(),
      }),
    )
    .optional(),

  // Event configuration
  eventConfig: z
    .object({
      eventName: z.string().default('postback'),
      eventType: z.number().default(5),
      recordRevenue: z.boolean().default(false),
      revenueField: z.string().optional(),
      currencyField: z.string().optional(),
    })
    .optional(),

  // Response configuration
  response: z
    .object({
      mode: z.enum(['minimal', 'passthrough', 'detailed']).default('minimal'),
      successCode: z.number().default(200),
    })
    .optional(),
});

export type EndpointConfig = z.infer<typeof endpointConfigSchema>;
