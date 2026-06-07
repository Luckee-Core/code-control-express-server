/**
 * Get Data Entity Operations By Project ID
 */

import { SupabaseClient } from '@supabase/supabase-js';

export type DataEntityOperation = {
  id: string;
  data_entity_id: string;
  operation_key: string;
  created_at: string;
  updated_at: string;
};

export const getDataEntityOperationsByProjectId = async (
  supabase: SupabaseClient,
  projectId: string
): Promise<DataEntityOperation[]> => {
  const { data: entities, error: entitiesError } = await supabase
    .from('data_entity')
    .select('id')
    .eq('project_id', projectId);

  if (entitiesError) {
    throw new Error(`Failed to fetch entity ids: ${entitiesError.message}`);
  }

  const entityIds = (entities ?? []).map((e) => e.id);
  if (entityIds.length === 0) return [];

  const { data, error } = await supabase
    .from('data_entity_operation')
    .select('id, data_entity_id, operation_key, created_at, updated_at')
    .in('data_entity_id', entityIds);

  if (error) {
    throw new Error(`Failed to fetch data entity operations: ${error.message}`);
  }

  return (data ?? []) as DataEntityOperation[];
};
