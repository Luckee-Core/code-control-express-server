import type { SupabaseClient } from '@supabase/supabase-js';

export type DataModelGenerationQueue = {
  id: string;
  project_id: string;
  repo_id: string;
  entity_id: string;
  file_path: string;
  file_content: string | null;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  scheduled_at: string;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  cursor_exchange_id: string | null;
  created_at: string;
  updated_at: string;
};

export const getDataModelQueueByRepo = async (
  supabase: SupabaseClient,
  repoId: string
): Promise<DataModelGenerationQueue[]> => {
  const { data, error } = await supabase
    .from('data_model_generation_queue')
    .select('*')
    .eq('repo_id', repoId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching data model queue:', error);
    throw error;
  }

  return data || [];
};
