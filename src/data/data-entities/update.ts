/**
 * Update Data Entity
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { DataEntity } from './get-by-project-id';

export type UpdateDataEntityInput = {
  name?: string;
  table_name?: string | null;
  sort_order?: number;
  assigned_repo_ids?: string[];
};

export const updateDataEntity = async (
  supabase: SupabaseClient,
  id: string,
  input: UpdateDataEntityInput
): Promise<DataEntity> => {
  const updateData: Record<string, unknown> = {};
  if (input.name !== undefined) updateData.name = input.name.trim();
  if (input.table_name !== undefined) updateData.table_name = input.table_name?.trim() || null;
  if (input.sort_order !== undefined) updateData.sort_order = input.sort_order;
  if (input.assigned_repo_ids !== undefined) {
    updateData.assigned_repo_ids = input.assigned_repo_ids;
  }

  const { data, error } = await supabase
    .from('data_entity')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update data entity: ${error.message}`);
  }

  return data as DataEntity;
};
