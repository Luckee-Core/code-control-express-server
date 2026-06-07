/**
 * Create Customer Project
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Project } from './get-all';

export type CreateProjectInput = {
  workspace_id: string;
  name: string;
  description?: string | null;
  app_type?: string;
  external_customer_id?: string | null;
};

export const createProject = async (
  supabase: SupabaseClient,
  input: CreateProjectInput
): Promise<Project> => {
  const row: Record<string, unknown> = {
    workspace_id: input.workspace_id,
    name: input.name.trim(),
    description: input.description?.trim() ?? null,
    ...(input.app_type && { app_type: input.app_type }),
    ...(input.external_customer_id && { external_customer_id: input.external_customer_id }),
  };
  const { data, error } = await supabase
    .from('projects')
    .insert(row)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create customer project: ${error.message}`);
  }

  return data as Project;
};
