/**
 * Get Data Entities By Project ID
 */

import { SupabaseClient } from '@supabase/supabase-js';

export type DataEntity = {
  id: string;
  project_id: string;
  name: string;
  table_name: string | null;
  description: string | null;
  sort_order: number;
  assigned_repo_ids: string[];
  created_at: string;
  updated_at: string;
};

export type DataEntityField = {
  id: string;
  entity_id: string;
  name: string;
  type: string;
  nullable: boolean;
  default_value: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type DataEntityWithFields = DataEntity & {
  fields: DataEntityField[];
};

export const getDataEntitiesByProjectId = async (
  supabase: SupabaseClient,
  projectId: string
): Promise<DataEntityWithFields[]> => {
  const { data: entities, error: entitiesError } = await supabase
    .from('data_entity')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (entitiesError) {
    throw new Error(`Failed to fetch data entities: ${entitiesError.message}`);
  }

  if (!entities || entities.length === 0) {
    return [];
  }

  const entityIds = entities.map((e) => e.id);
  const { data: fields, error: fieldsError } = await supabase
    .from('data_entity_field')
    .select('*')
    .in('entity_id', entityIds)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (fieldsError) {
    throw new Error(`Failed to fetch data entity fields: ${fieldsError.message}`);
  }

  const fieldsByEntity = (fields || []).reduce<Record<string, DataEntityField[]>>(
    (acc, f) => {
      if (!acc[f.entity_id]) acc[f.entity_id] = [];
      acc[f.entity_id].push(f as DataEntityField);
      return acc;
    },
    {}
  );

  return entities.map((e) => ({
    ...e,
    fields: fieldsByEntity[e.id] || [],
  })) as DataEntityWithFields[];
};
