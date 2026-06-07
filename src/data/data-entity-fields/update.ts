/**
 * Update Data Entity Field
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { DataEntityField } from './get-by-entity-id';

export type UpdateDataEntityFieldInput = {
  name?: string;
  type?: string;
  nullable?: boolean;
  default_value?: string | null;
  sort_order?: number;
  references_entity_id?: string | null;
};

export const updateDataEntityField = async (
  supabase: SupabaseClient,
  id: string,
  input: UpdateDataEntityFieldInput
): Promise<DataEntityField> => {
  const updateData: Record<string, unknown> = {};
  if (input.name !== undefined) updateData.name = input.name.trim();
  if (input.type !== undefined) updateData.type = input.type.trim();
  if (input.nullable !== undefined) updateData.nullable = input.nullable;
  if (input.default_value !== undefined) updateData.default_value = input.default_value?.trim() || null;
  if (input.sort_order !== undefined) updateData.sort_order = input.sort_order;
  if (input.references_entity_id !== undefined) updateData.references_entity_id = input.references_entity_id || null;

  const { data, error } = await supabase
    .from('data_entity_field')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update data entity field: ${error.message}`);
  }

  return data as DataEntityField;
};
