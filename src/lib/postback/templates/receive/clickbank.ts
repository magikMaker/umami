import type { ReceiveTemplate } from '../types';

/**
 * ClickBank Instant Notification Service (INS) postback template.
 * Note: ClickBank uses a different verification method (secret key in header).
 */
export const clickbankTemplate: ReceiveTemplate = {
  id: 'clickbank',
  name: 'ClickBank',
  description: 'ClickBank Instant Notification Service (INS) postbacks',
  source: 'ClickBank',
  docsUrl: 'https://support.clickbank.com/hc/en-us/articles/220364967',

  validation: {
    type: 'none', // ClickBank uses IP whitelisting + secret key verification
    fields: [],
    checksumField: '',
  },

  fieldMappings: [
    { source: 'ctransreceipt', target: 'transactionId', type: 'string' },
    { source: 'ctransamount', target: 'revenue', type: 'number' },
    { source: 'ccurrency', target: 'currency', type: 'string' },
    { source: 'ctransaction', target: 'status', type: 'string' },
    { source: 'caffitid', target: 'clickId', type: 'string' },
    { source: 'ctid', target: 'subId1', type: 'string' },
  ],

  standardFields: {
    clickId: 'caffitid',
    revenue: 'ctransamount',
    status: 'ctransaction',
    transactionId: 'ctransreceipt',
    currency: 'ccurrency',
    subId1: 'ctid',
  },

  configSchema: [
    {
      key: 'secretKey',
      label: 'Secret Key',
      type: 'string',
      required: false,
      description: 'Your ClickBank INS secret key (optional, for verification)',
    },
  ],
};
