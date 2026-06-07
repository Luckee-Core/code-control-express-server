/**
 * Update Customer Project
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Project } from './get-all';

export type UpdateProjectInput = {
  name?: string;
  description?: string | null;
};

export const updateProject = async (
  supabase: SupabaseClient,
  id: string,
  input: UpdateProjectInput
): Promise<Project> => {
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (input.name !== undefined) updateData.name = input.name.trim();
  if (input.description !== undefined) updateData.description = input.description?.trim() ?? null;

  const { data, error } = await supabase
    .from('customer_projects')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update customer project: ${error.message}`);
  }

  return data as Project;
};
