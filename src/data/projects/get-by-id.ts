/**
 * Get Customer Project By ID
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Project } from './get-all';

export const getProjectById = async (
  supabase: SupabaseClient,
  id: string
): Promise<Project | null> => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch customer project: ${error.message}`);
  }

  return data as Project;
};
