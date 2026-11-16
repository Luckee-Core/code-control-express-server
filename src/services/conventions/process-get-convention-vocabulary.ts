import { listColumnTypes } from '../../data/column-types';
import { listLifecycleOptions } from '../../data/lifecycle-options';
import { listStandardColumns } from '../../data/standard-columns';
import { listTableArchetypes } from '../../data/table-archetypes';
import type { CanonicalDataClient } from '../canonical-data-client';
import type { ConventionVocabulary } from './types';

/**
 * Loads the data-model vocabulary for GET /api/data/conventions/vocabulary.
 */
export const processGetConventionVocabulary = async (client: CanonicalDataClient): Promise<ConventionVocabulary> => {
  const [column_types, standard_columns, lifecycle_options, table_archetypes] = await Promise.all([
    listColumnTypes(client),
    listStandardColumns(client),
    listLifecycleOptions(client),
    listTableArchetypes(client),
  ]);
  return { column_types, standard_columns, lifecycle_options, table_archetypes };
};
