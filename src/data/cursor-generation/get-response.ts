import { getManagedSupabaseClient } from '../../db/supabase-client';

export type CursorGenerationResponse = {
  id: string;
  pr_url: string | null;
  pr_number: number | null;
  branch_name: string | null;
  files_changed: unknown | null;
  lines_added: number | null;
  lines_removed: number | null;
  agent_summary: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * Get cursor generation response by ID
 *
 * @param responseId - Response ID
 * @returns Response or null
 */
export const getCursorGenerationResponseById = async (
  responseId: string
): Promise<CursorGenerationResponse | null> => {
  const supabase = getManagedSupabaseClient();

  const { data, error } = await supabase
    .from('cursor_generation_responses')
    .select('*')
    .eq('id', responseId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('❌ Error fetching cursor generation response:', error);
    throw new Error(`Failed to fetch cursor generation response: ${error.message}`);
  }

  return data;
};
