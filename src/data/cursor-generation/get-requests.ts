import { getManagedSupabaseClient } from '../../db/supabase-client';

export type CursorGenerationRequest = {
  id: string;
  user_id: string | null;
  project_id: string;
  repo_id: string;
  entity_id: string;
  task_id: string;
  selected_task_id: string;
  prompt_text: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
};

/**
 * Get cursor generation requests by project ID
 *
 * @param projectId - Project ID
 * @returns Array of cursor generation requests
 */
export const getCursorGenerationRequestsByProject = async (
  projectId: string
): Promise<CursorGenerationRequest[]> => {
  const supabase = getManagedSupabaseClient();

  const { data, error } = await supabase
    .from('cursor_generation_requests')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching cursor generation requests:', error);
    throw new Error(`Failed to fetch cursor generation requests: ${error.message}`);
  }

  return data || [];
};

/**
 * Get cursor generation requests by entity ID
 *
 * @param entityId - Entity ID
 * @returns Array of cursor generation requests
 */
export const getCursorGenerationRequestsByEntity = async (
  entityId: string
): Promise<CursorGenerationRequest[]> => {
  const supabase = getManagedSupabaseClient();

  const { data, error } = await supabase
    .from('cursor_generation_requests')
    .select('*')
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching cursor generation requests by entity:', error);
    throw new Error(`Failed to fetch cursor generation requests: ${error.message}`);
  }

  return data || [];
};
