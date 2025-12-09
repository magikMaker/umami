import type { RelayTemplate } from '../types';

/**
 * Google Ads Offline Conversions relay template.
 * Sends conversion events to Google Ads for offline conversion tracking.
 */
export const googleAdsTemplate: RelayTemplate = {
  id: 'google-ads',
  name: 'Google Ads Conversions',
  description: 'Send offline conversions to Google Ads',
  destination: 'Google Ads',
  docsUrl: 'https://developers.google.com/google-ads/api/docs/conversions/overview',

  method: 'POST',
  format: 'json',
  urlTemplate:
    'https://googleads.googleapis.com/v14/customers/{{customerId}}:uploadClickConversions',

  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer {{accessToken}}',
    'developer-token': '{{developerToken}}',
  },

  bodyTemplate: {
    conversions: [
      {
        gclid: '{{clickId}}',
        conversion_action: '{{conversionAction}}',
        conversion_date_time: '{{timestamp}}',
        conversion_value: '{{revenue}}',
        currency_code: '{{currency|default:USD}}',
        order_id: '{{transactionId}}',
      },
    ],
    partialFailure: true,
  } as unknown as Record<string, string>,

  configSchema: [
    {
      key: 'customerId',
      label: 'Customer ID',
      type: 'string',
      required: true,
      description: 'Google Ads customer ID (without dashes)',
    },
    {
      key: 'conversionAction',
      label: 'Conversion Action',
      type: 'string',
      required: true,
      description: 'Resource name of the conversion action',
    },
    {
      key: 'accessToken',
      label: 'Access Token',
      type: 'string',
      required: true,
      description: 'OAuth2 access token',
    },
    {
      key: 'developerToken',
      label: 'Developer Token',
      type: 'string',
      required: true,
      description: 'Google Ads API developer token',
    },
  ],
};
