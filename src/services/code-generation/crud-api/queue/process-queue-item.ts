/**
 * Process a single CRUD API generation queue item.
 * Entity-level items: runCrudApiGeneration. Repo-level (e.g. table names config): runTableNamesConfigGeneration.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { CrudApiGenerationQueueItem } from '../../../../data/crud-api-generation-queue';
import { updateCrudApiQueueStatus } from '../../../../data/crud-api-generation-queue';
import { runCrudApiGeneration } from '../run-crud-api-generation';
import { runTableNamesConfigGeneration } from '../run-table-names-config-generation';

export type ProcessCrudApiQueueItemResult = {
  success: boolean;
  error?: string;
};

export const processCrudApiQueueItem = async (
  supabase: SupabaseClient,
  queueItem: CrudApiGenerationQueueItem
): Promise<ProcessCrudApiQueueItemResult> => {
  try {
    await updateCrudApiQueueStatus(supabase, queueItem.id, {
      status: 'processing',
    });

    const isTableNamesConfig =
      queueItem.entity_id == null && queueItem.operation_key === 'table_names_config';

    const result = isTableNamesConfig
      ? await runTableNamesConfigGeneration({
          projectId: queueItem.project_id,
          repoId: queueItem.repo_id,
          taskId: queueItem.task_id || '',
          filePath: queueItem.file_path || '',
        })
      : await runCrudApiGeneration({
          projectId: queueItem.project_id,
          repoId: queueItem.repo_id,
          entityId: queueItem.entity_id!,
          taskId: queueItem.task_id || '',
          operationKey: queueItem.operation_key || '',
          filePath: queueItem.file_path || '',
        });

    // Update status to completed
    await updateCrudApiQueueStatus(supabase, queueItem.id, {
      status: 'completed',
      pr_link: result.prUrl || undefined,
    });

    return { success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    // Update status to failed
    await updateCrudApiQueueStatus(supabase, queueItem.id, {
      status: 'failed',
      error: errorMessage,
    });

    return { success: false, error: errorMessage };
  }
};
