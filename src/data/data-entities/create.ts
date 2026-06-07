/**
 * Create Data Entity
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { DataEntity } from './get-by-project-id';

export type CreateDataEntityInput = {
  project_id: string;
  name: string;
  table_name?: string | null;
  description?: string | null;
  assigned_repo_ids?: string[] | null;
  sort_order?: number;
};

export const createDataEntity = async (
  supabase: SupabaseClient,
  input: CreateDataEntityInput
): Promise<DataEntity> => {
  let assignedRepoIds = input.assigned_repo_ids ?? [];
  if (assignedRepoIds.length === 0) {
    const { data: repos } = await supabase
      .from('customer_project_repos')
      .select('id')
      .eq('project_id', input.project_id)
      .eq('repo_type', 'express')
      .limit(1);
    if (repos?.[0]) {
      assignedRepoIds = [repos[0].id];
    }
  }

  const row: Record<string, unknown> = {
    project_id: input.project_id,
    name: input.name.trim(),
    table_name: input.table_name?.trim() || null,
    sort_order: input.sort_order ?? 0,
    assigned_repo_ids: assignedRepoIds,
  };
  if (input.description !== undefined) {
    row.description = input.description?.trim() || null;
  }
  const { data, error } = await supabase
    .from('data_entity')
    .insert(row)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create data entity: ${error.message}`);
  }

  return data as DataEntity;
};
