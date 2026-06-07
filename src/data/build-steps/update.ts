/**
 * Update Build Step
 * Updates an existing build step
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { BuildStep } from './get-all';

export type UpdateBuildStepInput = {
  name?: string;
  description?: string;
  repo_type?: 'express' | 'nextjs' | 'react-native';
  sort_order?: number;
  is_active?: boolean;
};

export const updateBuildStep = async (
  supabase: SupabaseClient,
  id: string,
  input: UpdateBuildStepInput
): Promise<BuildStep> => {
  const updates: Record<string, any> = {};
  
  if (input.name !== undefined) updates.name = input.name;
  if (input.description !== undefined) updates.description = input.description;
  if (input.repo_type !== undefined) updates.repo_type = input.repo_type;
  if (input.sort_order !== undefined) updates.sort_order = input.sort_order;
  if (input.is_active !== undefined) updates.is_active = input.is_active;

  const { data, error } = await supabase
    .from('build_steps')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};
