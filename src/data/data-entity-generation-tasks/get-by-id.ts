import { getManagedSupabaseClient } from '../../db/supabase-client';
import type { DataEntityGenerationTask } from './get-all';

/**
 * Get a generation task by ID
 * 
 * @param id - Task ID
 * @returns Generation task or null if not found
 */
export const getDataEntityGenerationTaskById = async (
  id: string
): Promise<DataEntityGenerationTask | null> => {
  const supabase = getManagedSupabaseClient();
  
  const { data, error } = await supabase
    .from('ard_tasks')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    console.error('❌ Error fetching generation task:', error);
    throw new Error(`Failed to fetch generation task: ${error.message}`);
  }
  
  return data;
};
