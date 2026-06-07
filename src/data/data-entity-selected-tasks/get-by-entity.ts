import { getManagedSupabaseClient } from '../../db/supabase-client';
import type { DataEntitySelectedTask } from './create';

/**
 * Get all selected tasks for an entity
 * 
 * @param entityId - Entity ID
 * @returns Array of selected tasks
 */
export const getDataEntitySelectedTasksByEntity = async (
  entityId: string
): Promise<DataEntitySelectedTask[]> => {
  const supabase = getManagedSupabaseClient();
  
  const { data, error } = await supabase
    .from('data_entity_selected_tasks')
    .select('*')
    .eq('entity_id', entityId)
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('❌ Error fetching selected tasks:', error);
    throw new Error(`Failed to fetch selected tasks: ${error.message}`);
  }
  
  return data || [];
};
