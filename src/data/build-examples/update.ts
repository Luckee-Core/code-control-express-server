/**
 * Update Build Example
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { BuildExample } from './get-all';

export type UpdateBuildExampleInput = {
  name?: string;
  tags?: string[];
  language?: string;
  code?: string;
};

export const updateBuildExample = async (
  supabase: SupabaseClient,
  id: string,
  input: UpdateBuildExampleInput
): Promise<BuildExample> => {
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (input.name !== undefined) updateData.name = input.name.trim();
  if (input.tags !== undefined) updateData.tags = input.tags;
  if (input.language !== undefined) updateData.language = input.language.trim();
  if (input.code !== undefined) updateData.code = input.code;

  const { data, error } = await supabase
    .from('build_examples')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update build example: ${error.message}`);
  }

  return data as BuildExample;
};
