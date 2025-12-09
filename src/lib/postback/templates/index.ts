/**
 * Postback templates module.
 * Provides functions to access receive and relay templates.
 */

import { chaturbateTemplate, clickbankTemplate, genericTemplate } from './receive';
import { facebookCapiTemplate, genericWebhookTemplate, googleAdsTemplate } from './relay';
import type { ReceiveTemplate, RelayTemplate } from './types';

/**
 * All available receive templates.
 */
const receiveTemplates: ReceiveTemplate[] = [
  genericTemplate,
  chaturbateTemplate,
  clickbankTemplate,
];

/**
 * All available relay templates.
 */
const relayTemplates: RelayTemplate[] = [
  genericWebhookTemplate,
  facebookCapiTemplate,
  googleAdsTemplate,
];

/**
 * Returns all available receive templates.
 */
export function getReceiveTemplates(): ReceiveTemplate[] {
  return receiveTemplates;
}

/**
 * Returns a receive template by ID.
 */
export function getReceiveTemplate(id: string): ReceiveTemplate | undefined {
  return receiveTemplates.find(t => t.id === id);
}

/**
 * Returns all available relay templates.
 */
export function getRelayTemplates(): RelayTemplate[] {
  return relayTemplates;
}

/**
 * Returns a relay template by ID.
 */
export function getRelayTemplate(id: string): RelayTemplate | undefined {
  return relayTemplates.find(t => t.id === id);
}

export type { ParsedPostback, ReceiveTemplate, RelayResult, RelayTemplate } from './types';
