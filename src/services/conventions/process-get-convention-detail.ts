import { getConventionById } from '../../data/conventions';
import { listConventionExamples } from '../../data/convention-examples';
import { listConventionRoles } from '../../data/convention-roles';
import { listConventionSources } from '../../data/convention-sources';
import type { CanonicalDataClient } from '../canonical-data-client';
import type { ConventionDetail } from './types';

/**
 * Loads a convention with its roles, examples and sources for GET /api/data/conventions/:id.
 */
export const processGetConventionDetail = async (
  client: CanonicalDataClient,
  id: string
): Promise<ConventionDetail | null> => {
  const [convention, roles, examples, sources] = await Promise.all([
    getConventionById(client, id),
    listConventionRoles(client, id),
    listConventionExamples(client, id),
    listConventionSources(client, id),
  ]);
  if (!convention) return null;
  return { convention, roles, examples, sources };
};
