import type { SupabaseClient } from '@supabase/supabase-js';

type CreateQueueItemInput = {
  project_id: string;
  repo_id: string;
  entity_id: string;
  task_id: string;
  operation_key: string;
  file_path: string;
};

export const createCrudApiQueueBatch = async (
  supabase: SupabaseClient,
  items: CreateQueueItemInput[]
) => {
  const rows = items.map((item) => ({
    ...item,
    status: 'queued',
  }));
  const { data, error } = await supabase
    .from('crud_api_generation_queue')
    .insert(rows)
    .select();

  if (error) {
    console.error('❌ Error creating CRUD API queue items:', error);
    throw error;
  }

  return data;
};
