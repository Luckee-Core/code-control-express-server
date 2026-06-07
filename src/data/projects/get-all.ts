/**
 * Project type (matches customer_projects table; API route is /projects)
 */

import { SupabaseClient } from '@supabase/supabase-js';

export type Project = {
  id: string;
  customer_id: string;
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
    .from('customer_projects')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch customer projects: ${error.message}`);
  }

  return data || [];
};
