import { getManagedSupabaseClient } from '../../db/supabase-client';

/**
 * Get all selected tasks across all entities
 * 
 * @returns Array of all selected tasks
 */
export const getAllDataEntitySelectedTasks = async () => {
  const supabase = getManagedSupabaseClient();
  
  const { data, error } = await supabase
    .from('data_entity_selected_tasks')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('❌ Error fetching all selected tasks:', error);
    throw new Error(`Failed to fetch all selected tasks: ${error.message}`);
  }
  
  return data || [];
};
