import { getManagedSupabaseClient } from '../../db/supabase-client';
import { ProjectRepo } from '../../db/types';

export const getAllProjectRepos = async (): Promise<ProjectRepo[]> => {
  const supabase = getManagedSupabaseClient();

  const { data, error } = await supabase
    .from('customer_project_repos')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all customer project repos:', error);
    throw error;
  }

  return data || [];
};
