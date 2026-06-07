import type { SupabaseClient } from '@supabase/supabase-js';

export type CrudApiGenerationQueueItem = {
  id: string;
  project_id: string;
  repo_id: string;
  entity_id: string | null;
  task_id: string | null;
  operation_key: string | null;
  file_path: string | null;
  selected_operation_keys: string[] | null; // Legacy field, will be deprecated
  status: 'queued' | 'processing' | 'completed' | 'failed';
  pr_link: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
};

export const getAllCrudApiQueue = async (supabase: SupabaseClient): Promise<CrudApiGenerationQueueItem[]> => {
  const { data, error } = await supabase
    .from('crud_api_generation_queue')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching CRUD API queue:', error);
    throw error;
  }

  return data || [];
};
