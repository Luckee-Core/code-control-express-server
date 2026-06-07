/**
 * Project type (matches projects table)
 */

import { SupabaseClient } from '@supabase/supabase-js';

export type Project = {
  id: string;
  workspace_id: string;
  external_customer_id: string | null;
  name: string;
  description: string | null;
  app_type?: string;
  app_type_config?: Record<string, unknown>;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
};

/**
 * Get all customer projects (for Projects table page)
 */
export const getAllProjects = async (
  supabase: SupabaseClient
): Promise<Project[]> => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch customer projects: ${error.message}`);
  }

  return data || [];
};
