import { listConventionDomains } from '../../data/convention-domains';
import { listConventionTopics } from '../../data/convention-topics';
import { listRepoRoles } from '../../data/repo-roles';
import type { CanonicalDataClient } from '../canonical-data-client';
import type { ConventionOptions } from './types';

/**
 * Loads dropdown lists (domains, topics, repo roles) for GET /api/data/conventions/options.
 */
export const processGetConventionOptions = async (client: CanonicalDataClient): Promise<ConventionOptions> => {
  const [domains, topics, repo_roles] = await Promise.all([
    listConventionDomains(client),
    listConventionTopics(client),
    listRepoRoles(client),
  ]);
  return { domains, topics, repo_roles };
};
