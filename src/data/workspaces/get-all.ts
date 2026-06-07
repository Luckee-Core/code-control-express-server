import { SupabaseClient } from '@supabase/supabase-js';

export type Workspace = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
};

/**
 * Get all workspaces.
 */
export const getAllWorkspaces = async (
  supabase: SupabaseClient
): Promise<Workspace[]> => {
  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch workspaces: ${error.message}`);
  }

  return data || [];
};
