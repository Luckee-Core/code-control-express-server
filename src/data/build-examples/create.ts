/**
 * Create Build Example
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { BuildExample } from './get-all';

export type CreateBuildExampleInput = {
  name: string;
  tags: string[];
  language: string;
  code: string;
};

export const createBuildExample = async (
  supabase: SupabaseClient,
  input: CreateBuildExampleInput
): Promise<BuildExample> => {
  const row = {
    name: input.name.trim(),
    tags: input.tags ?? [],
    language: input.language.trim(),
    code: input.code,
  };
  const { data, error } = await supabase
    .from('build_examples')
    .insert(row)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create build example: ${error.message}`);
  }

  return data as BuildExample;
};
