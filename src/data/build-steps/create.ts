/**
 * Create Build Step
 * Creates a new build step
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { BuildStep } from './get-all';

export type CreateBuildStepInput = {
  name: string;
  description?: string;
  repo_type: 'express' | 'nextjs' | 'react-native';
  sort_order?: number;
  is_active?: boolean;
};

export const createBuildStep = async (
  supabase: SupabaseClient,
  input: CreateBuildStepInput
): Promise<BuildStep> => {
  const { data, error} = await supabase
    .from('build_steps')
    .insert({
      name: input.name,
      description: input.description || null,
      repo_type: input.repo_type,
      sort_order: input.sort_order || 0,
      is_active: input.is_active !== undefined ? input.is_active : true,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};
