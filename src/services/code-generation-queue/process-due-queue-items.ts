/**
 * Process Due Code Generation Queue Items
 * Gets all due items and processes each one sequentially (each takes 30-120 seconds)
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { getDueQueueItems } from '../../data/code-generation-queue';
import { processQueueItem } from './process-queue-item';

export type ProcessDueQueueItemsResult = {
  success: boolean;
  processed: number;
  successful: number;
  failed: number;
  errors: string[];
};

export const processDueQueueItems = async (
  supabase: SupabaseClient
): Promise<ProcessDueQueueItemsResult> => {
  const result: ProcessDueQueueItemsResult = {
    success: true,
    processed: 0,
    successful: 0,
    failed: 0,
    errors: [],
  };

  try {
    const dueItems = await getDueQueueItems(supabase, 5);

    if (dueItems.length === 0) {
      console.log('No due code generation queue items to process');
      return result;
    }

    console.log(`Processing ${dueItems.length} due code generation queue items`);

    for (const item of dueItems) {
      result.processed++;

      try {
        const processResult = await processQueueItem(supabase, item);

        if (processResult.success) {
          result.successful++;
          console.log(
            `✅ Successfully processed queue item ${item.id} (entity ${item.entity_id}, task ${item.task_id})`
          );
        } else {
          result.failed++;
          result.errors.push(
            `Queue item ${item.id}: ${processResult.error || 'Unknown error'}`
          );
          console.error(`❌ Failed queue item ${item.id}:`, processResult.error);
        }
      } catch (error) {
        result.failed++;
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`Queue item ${item.id}: ${errorMessage}`);
        console.error(`❌ Error processing queue item ${item.id}:`, error);
      }
    }

    console.log(
      `Code generation queue processing complete: ${result.successful} successful, ${result.failed} failed`
    );

    return result;
  } catch (error) {
    console.error('Error processing due code generation queue:', error);
    result.success = false;
    result.errors.push(
      error instanceof Error ? error.message : 'Unknown error'
    );
    return result;
  }
};
