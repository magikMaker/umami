import type { RelayTemplate } from '../types';

/**
 * Generic webhook relay template.
 * Forwards all extracted fields as JSON to a custom endpoint.
 */
export const genericWebhookTemplate: RelayTemplate = {
  id: 'generic-webhook',
  name: 'Generic Webhook',
  description: 'Forward postback data as JSON to any webhook URL',
  destination: 'Custom Webhook',

  method: 'POST',
  format: 'json',
  urlTemplate: '{{webhookUrl}}',

  headers: {
    'Content-Type': 'application/json',
    'X-Postback-Source': 'umami',
  },

  bodyTemplate: {
    click_id: '{{clickId}}',
    transaction_id: '{{transactionId}}',
    revenue: '{{revenue}}',
    currency: '{{currency}}',
    status: '{{status}}',
    sub_id_1: '{{subId1}}',
    sub_id_2: '{{subId2}}',
    sub_id_3: '{{subId3}}',
    timestamp: '{{timestamp}}',
  },

  configSchema: [
    {
      key: 'webhookUrl',
      label: 'Webhook URL',
      type: 'string',
      required: true,
      description: 'The URL to send the postback data to',
    },
  ],
};
