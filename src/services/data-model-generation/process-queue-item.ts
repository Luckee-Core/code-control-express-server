/**
 * Process a single Data Model generation queue item.
 * Generates TypeScript model files using AI based on entity definition.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { DataModelGenerationQueue } from '../../data/data-model-generation-queue';
import { updateDataModelQueueStatus } from '../../data/data-model-generation-queue';
import { generateModelFile } from './generate-model-file';

export type ProcessDataModelQueueItemResult = {
  success: boolean;
  error?: string;
};

export const processDataModelQueueItem = async (
  supabase: SupabaseClient,
  queueItem: DataModelGenerationQueue
): Promise<ProcessDataModelQueueItemResult> => {
  const now = new Date().toISOString();

  try {
    console.log('⚙️ Processing data model queue item:', queueItem.id);

    await updateDataModelQueueStatus(supabase, queueItem.id, {
      status: 'processing',
      started_at: now,
    });

    const result = await generateModelFile({
      projectId: queueItem.project_id,
      repoId: queueItem.repo_id,
      entityId: queueItem.entity_id,
    });

    await updateDataModelQueueStatus(supabase, queueItem.id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      cursor_exchange_id: result.cursorExchangeId,
      file_content: result.fileContent,
    });

    console.log('✅ Data model queue item completed:', queueItem.id);
    return { success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    console.error('❌ Data model queue item failed:', queueItem.id, errorMessage);

    await updateDataModelQueueStatus(supabase, queueItem.id, {
      status: 'failed',
      completed_at: new Date().toISOString(),
      error_message: errorMessage,
    });

    return { success: false, error: errorMessage };
  }
};
