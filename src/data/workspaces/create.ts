import { SupabaseClient } from '@supabase/supabase-js';
import { Workspace } from './get-all';

export type CreateWorkspaceInput = {
  name: string;
  slug: string;
};

/**
 * Create a workspace.
 */
export const createWorkspace = async (
  supabase: SupabaseClient,
  input: CreateWorkspaceInput
): Promise<Workspace> => {
  const { data, error } = await supabase
    .from('workspaces')
    .insert({
      name: input.name.trim(),
      slug: input.slug.trim().toLowerCase(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create workspace: ${error.message}`);
  }

  return data as Workspace;
};
