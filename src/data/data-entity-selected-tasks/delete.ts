import { getManagedSupabaseClient } from '../../db/supabase-client';

/**
 * Delete a selected task (user unchecks a checkbox)
 * 
 * @param id - Selected task ID
 */
export const deleteDataEntitySelectedTask = async (id: string): Promise<void> => {
  const supabase = getManagedSupabaseClient();
  
  const { error } = await supabase
    .from('data_entity_selected_tasks')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('❌ Error deleting selected task:', error);
    throw new Error(`Failed to delete selected task: ${error.message}`);
  }
};
