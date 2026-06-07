import { getManagedSupabaseClient } from '../../db/supabase-client';

export type DataEntityGenerationTask = {
  id: string;
  name: string;
  task_type: string;
  description: string | null;
  prompt_template: string;
  output_path_template: string;
  required_conventions_tags: string[] | null;
  required_examples_tags: string[] | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

/**
 * Get all available code generation tasks
 * 
 * @returns Array of generation tasks ordered by sort_order
 */
export const getAllDataEntityGenerationTasks = async (): Promise<DataEntityGenerationTask[]> => {
  const supabase = getManagedSupabaseClient();
  
  const { data, error } = await supabase
    .from('data_entity_generation_tasks')
    .select('*')
    .order('sort_order', { ascending: true });
  
  if (error) {
    console.error('❌ Error fetching generation tasks:', error);
    throw new Error(`Failed to fetch generation tasks: ${error.message}`);
  }
  
  return data || [];
};
