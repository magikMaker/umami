import type { RelayTemplate } from '../types';

/**
 * Facebook Conversions API (CAPI) relay template.
 * Sends conversion events to Facebook for attribution.
 */
export const facebookCapiTemplate: RelayTemplate = {
  id: 'facebook-capi',
  name: 'Facebook Conversions API',
  description: 'Send conversion events to Facebook CAPI for server-side tracking',
  destination: 'Facebook',
  docsUrl: 'https://developers.facebook.com/docs/marketing-api/conversions-api',

  method: 'POST',
  format: 'json',
  urlTemplate: 'https://graph.facebook.com/v18.0/{{pixelId}}/events?access_token={{accessToken}}',

  headers: {
    'Content-Type': 'application/json',
  },

  bodyTemplate: {
    data: [
      {
        event_name: 'Purchase',
        event_time: '{{timestamp}}',
        event_id: '{{transactionId}}',
        event_source_url: '{{sourceUrl}}',
        action_source: 'website',
        user_data: {
          fbp: '{{clickId}}',
          client_ip_address: '{{clientIp}}',
          client_user_agent: '{{userAgent}}',
        },
        custom_data: {
          currency: '{{currency|default:USD}}',
          value: '{{revenue}}',
        },
      },
    ],
  } as unknown as Record<string, string>,

  configSchema: [
    {
      key: 'pixelId',
      label: 'Pixel ID',
      type: 'string',
      required: true,
      description: 'Your Facebook Pixel ID',
    },
    {
      key: 'accessToken',
      label: 'Access Token',
      type: 'string',
      required: true,
      description: 'Facebook Conversions API access token',
    },
  ],
};
