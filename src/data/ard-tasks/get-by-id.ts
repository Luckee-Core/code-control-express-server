import { getManagedSupabaseClient } from '../../db/supabase-client';

export type ARDTask = {
  id: string;
  name: string;
  description: string | null;
  task_type: string;
  prompt_template: string;
  output_path_template: string;
  required_conventions_tags: string[] | null;
  required_examples_tags: string[] | null;
  sort_order: number;
  stack_type: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * Get an ARD task by ID
 * 
 * @param id - Task ID
 * @returns ARD task or null if not found
 */
export const getARDTaskById = async (
  id: string
): Promise<ARDTask | null> => {
  const supabase = getManagedSupabaseClient();
  
  const { data, error } = await supabase
    .from('ard_tasks')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('❌ Error fetching ARD task:', error);
    throw new Error(`Failed to fetch ARD task: ${error.message}`);
  }
  
  return data;
};
