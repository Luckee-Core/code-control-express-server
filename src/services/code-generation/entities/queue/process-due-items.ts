/**
 * Process Due Entity Code Generation Queue Items
 * Gets next due item (LIMIT 1) and processes it
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { getDueQueueItems } from '../../../../data/code-generation-queue';
import { processEntityQueueItem } from './process-queue-item';

export type ProcessDueItemsResult = {
  success: boolean;
  processed: number;
  successful: number;
  failed: number;
  errors: string[];
};

export const processDueEntityItems = async (
  supabase: SupabaseClient
): Promise<ProcessDueItemsResult> => {
  const result: ProcessDueItemsResult = {
    success: true,
    processed: 0,
    successful: 0,
    failed: 0,
    errors: [],
  };

  try {
    const dueItems = await getDueQueueItems(supabase, 1);

    if (dueItems.length === 0) {
      console.log('No due entity code generation queue items to process');
      return result;
    }

    console.log(`Processing 1 entity code generation queue item`);

    const item = dueItems[0];
    result.processed++;

    try {
      const processResult = await processEntityQueueItem(supabase, item);

      if (processResult.success) {
        result.successful++;
        console.log(
          `✅ Successfully processed entity queue item ${item.id} (entity ${item.entity_id}, task ${item.task_id})`
        );
      } else {
        result.failed++;
        result.errors.push(
          `Queue item ${item.id}: ${processResult.error || 'Unknown error'}`
        );
        console.error(`❌ Failed entity queue item ${item.id}:`, processResult.error);
      }
    } catch (error) {
      result.failed++;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(`Queue item ${item.id}: ${errorMessage}`);
      console.error(`❌ Error processing entity queue item ${item.id}:`, error);
    }

    console.log(
      `Entity code generation queue processing complete: ${result.successful} successful, ${result.failed} failed`
    );

    return result;
  } catch (error) {
    console.error('Error processing due entity code generation queue:', error);
    result.success = false;
    result.errors.push(
      error instanceof Error ? error.message : 'Unknown error'
    );
    return result;
  }
};
