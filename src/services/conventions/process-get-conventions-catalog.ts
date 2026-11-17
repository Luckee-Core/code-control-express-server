import { listColumnTypes } from '../../data/column-types';
import { listConventionDomains } from '../../data/convention-domains';
import { listConventionRoles } from '../../data/convention-roles';
import { listConventionTopics } from '../../data/convention-topics';
import { listLifecycleOptions } from '../../data/lifecycle-options';
import { listRepoRoles } from '../../data/repo-roles';
import { listStandardColumns } from '../../data/standard-columns';
import { listTableArchetypes } from '../../data/table-archetypes';
import type { CanonicalDataClient } from '../canonical-data-client';
import type { ConventionsCatalog } from './types';

/**
 * Loads every lookup the conventions UI needs in one call.
 */
export const processGetConventionsCatalog = async (
  client: CanonicalDataClient,
): Promise<ConventionsCatalog> => {
  const [domains, topics, repoRoles, conventionRoles, columnTypes, standardColumns, lifecycleOptions, tableArchetypes] =
    await Promise.all([
      listConventionDomains(client),
      listConventionTopics(client),
      listRepoRoles(client),
      listConventionRoles(client, null),
      listColumnTypes(client),
      listStandardColumns(client),
      listLifecycleOptions(client),
      listTableArchetypes(client),
    ]);
  return {
    domains,
    topics,
    repo_roles: repoRoles,
    convention_roles: conventionRoles,
    column_types: columnTypes,
    standard_columns: standardColumns,
    lifecycle_options: lifecycleOptions,
    table_archetypes: tableArchetypes,
  };
};
