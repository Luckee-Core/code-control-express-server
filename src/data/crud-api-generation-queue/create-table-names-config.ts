import type { SupabaseClient } from '@supabase/supabase-js';
import { getAllCrudApiTasks } from '../crud-api-tasks';
import type { CrudApiGenerationQueueItem } from './get-all';

const TABLE_NAMES_CONFIG_OPERATION_KEY = 'table_names_config';

export type CreateTableNamesConfigQueueItemInput = {
  project_id: string;
  repo_id: string;
};

/**
 * Create one repo-level queue item for the "table names config" task (SUPABASE_TABLE_NAMES).
 * If one already exists for this project+repo, returns it without inserting.
 */
export const createTableNamesConfigQueueItem = async (
  supabase: SupabaseClient,
  input: CreateTableNamesConfigQueueItemInput
): Promise<CrudApiGenerationQueueItem> => {
  const tasks = await getAllCrudApiTasks(supabase);
  const task = tasks.find((t) => t.operation_key === TABLE_NAMES_CONFIG_OPERATION_KEY);
  if (!task) {
    throw new Error('CRUD API task "table_names_config" not found. Run migrations 088.');
  }

  const { data: existing } = await supabase
    .from('crud_api_generation_queue')
    .select('*')
    .eq('project_id', input.project_id)
    .eq('repo_id', input.repo_id)
    .eq('task_id', task.id)
    .is('entity_id', null)
    .maybeSingle();

  if (existing) {
    return existing as CrudApiGenerationQueueItem;
  }

  const { data: inserted, error } = await supabase
    .from('crud_api_generation_queue')
    .insert({
      project_id: input.project_id,
      repo_id: input.repo_id,
      entity_id: null,
      task_id: task.id,
      operation_key: task.operation_key,
      file_path: task.output_path_template,
      status: 'queued',
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      const { data: existingAfterConflict } = await supabase
        .from('crud_api_generation_queue')
        .select('*')
        .eq('project_id', input.project_id)
        .eq('repo_id', input.repo_id)
        .eq('task_id', task.id)
        .is('entity_id', null)
        .single();
      if (existingAfterConflict) {
        return existingAfterConflict as CrudApiGenerationQueueItem;
      }
    }
    throw error;
  }

  return inserted as CrudApiGenerationQueueItem;
};
