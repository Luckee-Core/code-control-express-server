import { SupabaseClient } from '@supabase/supabase-js';
import { Workspace } from './get-all';

/**
 * Get workspace by ID.
 */
export const getWorkspaceById = async (
  supabase: SupabaseClient,
  id: string
): Promise<Workspace | null> => {
  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch workspace: ${error.message}`);
  }

  return data;
};
