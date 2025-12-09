import type { ReceiveTemplate } from '../types';

/**
 * Generic postback template with common field names.
 * No validation, just maps common field naming conventions.
 */
export const genericTemplate: ReceiveTemplate = {
  id: 'generic',
  name: 'Generic',
  description: 'Generic postback with common field names (click_id, revenue, status)',
  source: 'Generic',

  validation: {
    type: 'none',
    fields: [],
    checksumField: '',
  },

  fieldMappings: [
    { source: 'click_id', target: 'clickId', type: 'string' },
    { source: 'clickid', target: 'clickId', type: 'string' },
    { source: 'cid', target: 'clickId', type: 'string' },
    { source: 'revenue', target: 'revenue', type: 'number' },
    { source: 'payout', target: 'revenue', type: 'number' },
    { source: 'amount', target: 'revenue', type: 'number' },
    { source: 'status', target: 'status', type: 'string' },
    { source: 'event', target: 'status', type: 'string' },
    { source: 'transaction_id', target: 'transactionId', type: 'string' },
    { source: 'txn_id', target: 'transactionId', type: 'string' },
    { source: 'order_id', target: 'transactionId', type: 'string' },
    { source: 'currency', target: 'currency', type: 'string' },
    { source: 'sub1', target: 'subId1', type: 'string' },
    { source: 'sub2', target: 'subId2', type: 'string' },
    { source: 'sub3', target: 'subId3', type: 'string' },
    { source: 'sub4', target: 'subId4', type: 'string' },
    { source: 'sub5', target: 'subId5', type: 'string' },
    { source: 'subid1', target: 'subId1', type: 'string' },
    { source: 'subid2', target: 'subId2', type: 'string' },
    { source: 'subid3', target: 'subId3', type: 'string' },
    { source: 'subid4', target: 'subId4', type: 'string' },
    { source: 'subid5', target: 'subId5', type: 'string' },
  ],

  standardFields: {
    clickId: 'click_id',
    revenue: 'revenue',
    status: 'status',
    transactionId: 'transaction_id',
    currency: 'currency',
  },

  configSchema: [],
};
