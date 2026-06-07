import type { SupabaseClient } from '@supabase/supabase-js';
import type { DataModelGenerationQueue } from './get-by-repo';

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
  // Check if this exact combo already exists in queue
  const { data: existing, error: checkError } = await supabase
    .from('data_model_generation_queue')
    .select('*')
    .eq('project_id', input.project_id)
    .eq('repo_id', input.repo_id)
    .eq('entity_id', input.entity_id)
    .maybeSingle();

  if (checkError) {
    console.error('❌ Error checking for existing queue item:', checkError);
    throw checkError;
  }

  // If already exists, return existing item instead of creating duplicate
  if (existing) {
    console.log(`⚠️  Queue item already exists (${existing.status}):`, {
      entity_id: input.entity_id,
      repo_id: input.repo_id,
      existing_id: existing.id,
      status: existing.status
    });
    return existing;
  }

  // Create new queue item
  const { data, error } = await supabase
    .from('data_model_generation_queue')
    .insert({
      project_id: input.project_id,
      repo_id: input.repo_id,
      entity_id: input.entity_id,
      file_path: input.file_path,
      status: 'queued',
      scheduled_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    // Check if error is due to unique constraint violation
    if (error.code === '23505') {
      console.log('⚠️  Duplicate detected by unique constraint, fetching existing item');
      // Fetch and return the existing item
      const { data: existingItem, error: fetchError } = await supabase
        .from('data_model_generation_queue')
        .select('*')
        .eq('project_id', input.project_id)
        .eq('repo_id', input.repo_id)
        .eq('entity_id', input.entity_id)
        .single();

      if (fetchError || !existingItem) {
        console.error('❌ Error fetching existing item after constraint violation:', fetchError);
        throw fetchError || new Error('Could not fetch existing item');
      }

      return existingItem;
    }

    console.error('❌ Error creating data model queue item:', error);
    throw error;
  }

  return data;
};
