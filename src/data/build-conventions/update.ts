/**
 * Update Build Convention
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { BuildConvention } from './get-all';

export type UpdateBuildConventionInput = {
  name?: string;
  stack?: string;
  content?: string;
  tags?: string[];
};

export const updateBuildConvention = async (
  supabase: SupabaseClient,
  id: string,
  input: UpdateBuildConventionInput
): Promise<BuildConvention> => {
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (input.name !== undefined) updateData.name = input.name.trim();
  if (input.stack !== undefined) updateData.stack = input.stack.trim();
  if (input.content !== undefined) updateData.content = input.content;
  if (input.tags !== undefined) updateData.tags = input.tags;

  const { data, error } = await supabase
    .from('build_conventions')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update build convention: ${error.message}`);
  }

  return data as BuildConvention;
};
