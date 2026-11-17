import { listConventionExamples } from '../../data/convention-examples';
import { listConventionRoles } from '../../data/convention-roles';
import { listConventionSources } from '../../data/convention-sources';
import { getConventionById } from '../../data/conventions';
import type { CanonicalDataClient } from '../canonical-data-client';
import type { ConventionDetail } from './types';

/**
 * Loads a convention with its roles, examples and sources (null when missing).
 */
export const processGetConventionDetail = async (
  client: CanonicalDataClient,
  id: string,
): Promise<ConventionDetail | null> => {
  const convention = await getConventionById(client, id);
  if (!convention) return null;

  const [roles, examples, sources] = await Promise.all([
    listConventionRoles(client, id),
    listConventionExamples(client, id),
    listConventionSources(client, id),
  ]);
  return { convention, role_keys: roles.map((role) => role.role_key), examples, sources };
};
