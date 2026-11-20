import { listConventionRoles } from '../../data/convention-roles';
import { listConventions } from '../../data/conventions';
import type { Convention } from '../../model/convention';
import type { CanonicalDataClient } from '../canonical-data-client';
import { processGetConventionsContext } from '../conventions/process-get-conventions-context';
import { ROLE_CONVENTION_DOMAINS } from './config';

/** Domains whose conventions apply to a repo role ([] when unknown). */
export const domainsForRole = (role: string | null): string[] => (role ? ROLE_CONVENTION_DOMAINS[role] ?? [] : []);

/**
 * The active conventions for a role as AI context text (one section per domain), with keys so
 * the agents can cite them.
 */
export const loadRoleConventionsText = async (client: CanonicalDataClient, role: string | null): Promise<string> => {
  const domains = domainsForRole(role);
  if (domains.length === 0) return '(No conventions are defined for this repo role yet.)';
  const contexts = await Promise.all(domains.map((domainKey) => processGetConventionsContext(client, { domainKey, roleKey: role })));
  return contexts.map((context) => context.text).join('\n\n---\n\n');
};

/** Every convention (any status) with its role keys, for validation and catalog prompts. */
export const loadConventionCatalog = async (
  client: CanonicalDataClient,
): Promise<Array<Convention & { role_keys: string[] }>> => {
  const [conventions, roles] = await Promise.all([listConventions(client, {}), listConventionRoles(client, null)]);
  return conventions.map((convention) => ({
    ...convention,
    role_keys: roles.filter((link) => link.convention_id === convention.id).map((link) => link.role_key).sort(),
  }));
};
