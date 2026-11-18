import { listColumnTypes } from '../../data/column-types';
import { listConventionExamples } from '../../data/convention-examples';
import { listConventionTopics } from '../../data/convention-topics';
import { listConventions } from '../../data/conventions';
import { listLifecycleOptions } from '../../data/lifecycle-options';
import { listStandardColumns } from '../../data/standard-columns';
import { listTableArchetypes } from '../../data/table-archetypes';
import type { CanonicalDataClient } from '../canonical-data-client';
import { buildConventionsContext } from './build-conventions-context';
import type { ConventionsContext, ConventionsContextExclusions } from './types';

/**
 * Loads the active conventions for a domain (and optional repo role) and renders the AI context.
 * Data-model vocabulary is included only for the data_model domain.
 */
export const processGetConventionsContext = async (
  client: CanonicalDataClient,
  input: {
    domainKey: string;
    roleKey: string | null;
    /** Leave these out of the snapshot (and so out of the prompt text, vocabulary and rules). */
    exclude?: ConventionsContextExclusions;
  },
): Promise<ConventionsContext> => {
  const excludedTopics = new Set(input.exclude?.topic_keys ?? []);
  const excludedConventions = new Set(input.exclude?.convention_keys ?? []);
  const excludedArchetypes = new Set(input.exclude?.archetype_keys ?? []);
  const isDataModel = input.domainKey === 'data_model';
  const [conventions, examples, topics, columnTypes, standardColumns, lifecycleOptions, tableArchetypes] =
    await Promise.all([
      listConventions(client, {
        domain_key: input.domainKey,
        status: 'active',
        role_key: input.roleKey ?? undefined,
      }),
      listConventionExamples(client, null),
      listConventionTopics(client),
      isDataModel ? listColumnTypes(client) : Promise.resolve([]),
      isDataModel ? listStandardColumns(client) : Promise.resolve([]),
      isDataModel ? listLifecycleOptions(client) : Promise.resolve([]),
      isDataModel ? listTableArchetypes(client) : Promise.resolve([]),
    ]);

  return buildConventionsContext({
    domain_key: input.domainKey,
    role_key: input.roleKey,
    conventions: conventions
      .filter((convention) => !excludedTopics.has(convention.topic_key) && !excludedConventions.has(convention.key))
      .map((convention) => ({
        ...convention,
        examples: examples.filter((example) => example.convention_id === convention.id),
      })),
    topics: topics.filter((topic) => topic.domain_key === input.domainKey && !excludedTopics.has(topic.key)),
    column_types: columnTypes.filter((type) => type.is_active),
    standard_columns: standardColumns,
    lifecycle_options: lifecycleOptions,
    table_archetypes: tableArchetypes.filter((archetype) => !excludedArchetypes.has(archetype.key)),
  });
};
