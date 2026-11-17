import type { CanonicalDataClient } from '../canonical-data-client';
import { processGetConventionsContext, type ConventionsContext } from '../conventions';
import { DATA_MODEL_DOMAIN_KEY, DATA_MODEL_ROLE_KEY } from './config';
import type { DataModelVocabulary, ProposalRuleConvention } from './types';

export type LoadedDataModelConventions = {
  context: ConventionsContext;
  vocabulary: DataModelVocabulary;
  rules: ProposalRuleConvention[];
};

/**
 * Loads the active data-model conventions for the storage role once, and derives the prompt
 * text, the output-schema vocabulary and the lint rules from that same snapshot so all three agree.
 */
export const loadDataModelConventions = async (
  client: CanonicalDataClient,
): Promise<LoadedDataModelConventions> => {
  const context = await processGetConventionsContext(client, {
    domainKey: DATA_MODEL_DOMAIN_KEY,
    roleKey: DATA_MODEL_ROLE_KEY,
  });
  const { snapshot } = context;

  return {
    context,
    vocabulary: {
      column_type_keys: snapshot.column_types.map((type) => type.key),
      lifecycle_keys: snapshot.lifecycle_options.map((option) => option.key),
      archetype_keys: snapshot.table_archetypes.map((archetype) => archetype.key),
      standard_column_names: snapshot.standard_columns.map((column) => column.name),
    },
    rules: snapshot.conventions
      .filter((convention) => convention.check_kind === 'proposal')
      .map(({ key, severity, check_config }) => ({ key, severity, check_config })),
  };
};
