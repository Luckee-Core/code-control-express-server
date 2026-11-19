import { listConventionDomains } from '../../data/convention-domains';
import type { CanonicalDataClient } from '../canonical-data-client';
import { processGetConventionsContext } from '../conventions/process-get-conventions-context';
import { MAX_CONVENTIONS_CHARS } from './config';

/**
 * Rendered active conventions for one repo role, across every domain that has rules for it
 * (capped). '' when the role has none.
 */
export const loadRoleConventionsText = async (client: CanonicalDataClient, roleKey: string): Promise<string> => {
  const domains = await listConventionDomains(client);
  const parts: string[] = [];
  for (const domain of domains) {
    const context = await processGetConventionsContext(client, { domainKey: domain.key, roleKey });
    if (context.convention_count > 0) parts.push(context.text);
  }
  const text = parts.join('\n\n');
  return text.length > MAX_CONVENTIONS_CHARS ? `${text.slice(0, MAX_CONVENTIONS_CHARS - 1)}…` : text;
};
