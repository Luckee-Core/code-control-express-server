/**
 * Create Data Entity Field
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { DataEntityField } from './get-by-entity-id';

export type CreateDataEntityFieldInput = {
  entity_id: string;
  name: string;
  type: string;
  nullable?: boolean;
  default_value?: string | null;
  sort_order?: number;
  references_entity_id?: string | null;
};

export const createDataEntityField = async (
  supabase: SupabaseClient,
  input: CreateDataEntityFieldInput
): Promise<DataEntityField> => {
  const row = {
    entity_id: input.entity_id,
    name: input.name.trim(),
    type: input.type.trim(),
    nullable: input.nullable ?? true,
    default_value: input.default_value?.trim() || null,
    sort_order: input.sort_order ?? 0,
    references_entity_id: input.references_entity_id ?? null,
  };
  const { data, error } = await supabase
    .from('data_entity_field')
    .insert(row)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create data entity field: ${error.message}`);
  }

  return data as DataEntityField;
};
