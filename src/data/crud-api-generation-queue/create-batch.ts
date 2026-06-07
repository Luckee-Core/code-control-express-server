import type { SupabaseClient } from '@supabase/supabase-js';
import { queueProjectIdInsertFields } from '../../utils/queue';

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
    ...queueProjectIdInsertFields(item.project_id),
    repo_id: item.repo_id,
    entity_id: item.entity_id,
    task_id: item.task_id,
    operation_key: item.operation_key,
    file_path: item.file_path,
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
