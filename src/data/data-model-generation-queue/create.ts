import type { SupabaseClient } from '@supabase/supabase-js';
import type { DataModelGenerationQueue } from './get-by-repo';
import {
  CUSTOMER_QUEUE_PROJECT_ID_COLUMN,
  normalizeQueueProjectId,
  queueProjectIdInsertFields,
} from '../../utils/queue';

type CreateDataModelQueueInput = {
  project_id: string;
  repo_id: string;
  entity_id: string;
  file_path: string;
};

export const createDataModelQueueItem = async (
  supabase: SupabaseClient,
  input: CreateDataModelQueueInput
): Promise<DataModelGenerationQueue> => {
  const { data: existing, error: checkError } = await supabase
    .from('data_model_generation_queue')
    .select('*')
    .eq(CUSTOMER_QUEUE_PROJECT_ID_COLUMN, input.project_id)
    .eq('repo_id', input.repo_id)
    .eq('entity_id', input.entity_id)
    .maybeSingle();

  if (checkError) {
    console.error('❌ Error checking for existing queue item:', checkError);
    throw checkError;
  }

  if (existing) {
    console.log(`⚠️  Queue item already exists (${existing.status}):`, {
      entity_id: input.entity_id,
      repo_id: input.repo_id,
      existing_id: existing.id,
      status: existing.status,
    });
    return normalizeQueueProjectId(existing);
  }

  const { data, error } = await supabase
    .from('data_model_generation_queue')
    .insert({
      ...queueProjectIdInsertFields(input.project_id),
      repo_id: input.repo_id,
      entity_id: input.entity_id,
      file_path: input.file_path,
      status: 'queued',
      scheduled_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      console.log('⚠️  Duplicate detected by unique constraint, fetching existing item');
      const { data: existingItem, error: fetchError } = await supabase
        .from('data_model_generation_queue')
        .select('*')
        .eq(CUSTOMER_QUEUE_PROJECT_ID_COLUMN, input.project_id)
        .eq('repo_id', input.repo_id)
        .eq('entity_id', input.entity_id)
        .single();

      if (fetchError || !existingItem) {
        console.error('❌ Error fetching existing item after constraint violation:', fetchError);
        throw fetchError || new Error('Could not fetch existing item');
      }

      return normalizeQueueProjectId(existingItem);
    }

    console.error('❌ Error creating data model queue item:', error);
    throw error;
  }

  return normalizeQueueProjectId(data);
};
