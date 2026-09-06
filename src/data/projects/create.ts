/**
 * Create Customer Project
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Project } from './get-all';

export type CreateProjectInput = {
  customer_id: string;
  name: string;
  description?: string | null;
};

export const createProject = async (
  supabase: SupabaseClient,
  input: CreateProjectInput
): Promise<Project> => {
  const row: Record<string, unknown> = {
    customer_id: input.customer_id,
    name: input.name.trim(),
    description: input.description?.trim() ?? null,
  };
  const { data, error } = await supabase
    .from('customer_projects')
    .insert(row)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create customer project: ${error.message}`);
  }

  return data as Project;
};
