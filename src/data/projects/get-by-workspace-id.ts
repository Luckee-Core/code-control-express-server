/**
 * Get Customer Projects By Customer ID
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Project } from './get-all';

export const getProjectsByWorkspaceId = async (
  supabase: SupabaseClient,
  workspaceId: string
): Promise<Project[]> => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch customer projects: ${error.message}`);
  }

  return data || [];
};
