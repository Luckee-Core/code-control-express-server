/**
 * Create Build Convention
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { BuildConvention } from './get-all';

export type CreateBuildConventionInput = {
  name: string;
  stack: string;
  content: string;
  tags?: string[];
};

export const createBuildConvention = async (
  supabase: SupabaseClient,
  input: CreateBuildConventionInput
): Promise<BuildConvention> => {
  const row = {
    name: input.name.trim(),
    stack: input.stack.trim(),
    content: input.content,
    tags: input.tags ?? [],
  };
  const { data, error } = await supabase
    .from('build_conventions')
    .insert(row)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create build convention: ${error.message}`);
  }

  return data as BuildConvention;
};
