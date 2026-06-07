import { getManagedSupabaseClient } from '../../db/supabase-client';

export type CreateDataEntitySelectedTaskInput = {
  entity_id: string;
  task_id: string;
};

export type DataEntitySelectedTask = {
  id: string;
  entity_id: string;
  task_id: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  agent_id: string | null;
  pr_url: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * Create a new selected task (user checks a checkbox)
 * 
 * @param input - Entity ID and task ID
 * @returns Created selected task
 */
export const createDataEntitySelectedTask = async (
  input: CreateDataEntitySelectedTaskInput
): Promise<DataEntitySelectedTask> => {
  const supabase = getManagedSupabaseClient();
  
  const { data, error } = await supabase
    .from('data_entity_selected_tasks')
    .insert({
      entity_id: input.entity_id,
      task_id: input.task_id,
      status: 'pending',
    })
    .select()
    .single();
  
  if (error) {
    console.error('❌ Error creating selected task:', error);
    throw new Error(`Failed to create selected task: ${error.message}`);
  }
  
  return data;
};
