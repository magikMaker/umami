import type { ReceiveTemplate } from '../types';

/**
 * Chaturbate affiliate postback template.
 * Validates using MD5 checksum: MD5(salt + log_id + attempt)
 */
export const chaturbateTemplate: ReceiveTemplate = {
  id: 'chaturbate',
  name: 'Chaturbate',
  description: 'Chaturbate affiliate program postbacks with MD5 validation',
  source: 'Chaturbate',
  docsUrl: 'https://chaturbate.com/affiliates/',

  validation: {
    type: 'md5',
    fields: ['log_id', 'attempt'],
    checksumField: 'checksum',
    saltConfigKey: 'validationSalt',
    formula: '{{salt}}{{log_id}}{{attempt}}',
  },

  fieldMappings: [
    { source: 'click_id', target: 'clickId', type: 'string' },
    { source: 'log_id', target: 'transactionId', type: 'string' },
    { source: 'token_amount', target: 'revenue', type: 'number' },
    { source: 'conversion_type', target: 'status', type: 'string' },
    { source: 'campaign', target: 'subId1', type: 'string' },
    { source: 'tour', target: 'subId2', type: 'string' },
    { source: 'track', target: 'subId3', type: 'string' },
  ],

  standardFields: {
    clickId: 'click_id',
    revenue: 'token_amount',
    status: 'conversion_type',
    transactionId: 'log_id',
  },

  configSchema: [
    {
      key: 'validationSalt',
      label: 'Validation Salt',
      type: 'string',
      required: true,
      description: 'The salt phrase configured in your Chaturbate affiliate settings',
    },
  ],
};
