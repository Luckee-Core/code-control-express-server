import { getManagedSupabaseClient } from '../../db/supabase-client';
import type { DataEntitySelectedTask } from './create';

export type UpdateDataEntitySelectedTaskInput = {
  status?: 'pending' | 'generating' | 'completed' | 'failed';
  agent_id?: string | null;
  pr_url?: string | null;
  error_message?: string | null;
  cursor_exchange_id?: string | null;
};

/**
 * Update a selected task
 * 
 * @param id - Selected task ID
 * @param input - Fields to update
 * @returns Updated selected task
 */
export const updateDataEntitySelectedTask = async (
  id: string,
  input: UpdateDataEntitySelectedTaskInput
): Promise<DataEntitySelectedTask> => {
  const supabase = getManagedSupabaseClient();
  
  const { data, error} = await supabase
    .from('data_entity_selected_tasks')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('❌ Error updating selected task:', error);
    throw new Error(`Failed to update selected task: ${error.message}`);
  }
  
  return data;
};
