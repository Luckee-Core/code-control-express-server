/**
 * Process Due CRUD API Generation Queue Items
 * Gets next due item (LIMIT 1) and processes it
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { getDueCrudApiQueueItems } from '../../../../data/crud-api-generation-queue';
import { processCrudApiQueueItem } from './process-queue-item';

export type ProcessDueCrudApiItemsResult = {
  success: boolean;
  processed: number;
  successful: number;
  failed: number;
  errors: string[];
};

export const processDueCrudApiItems = async (
  supabase: SupabaseClient
): Promise<ProcessDueCrudApiItemsResult> => {
  const result: ProcessDueCrudApiItemsResult = {
    success: true,
    processed: 0,
    successful: 0,
    failed: 0,
    errors: [],
  };

  try {
    const dueItems = await getDueCrudApiQueueItems(supabase, 1);

    if (dueItems.length === 0) {
      console.log('   CRUD API: no queued items');
      return result;
    }

    console.log(`   CRUD API: processing 1 item (id: ${dueItems[0].id})`);

    const item = dueItems[0];
    result.processed++;

    try {
      const processResult = await processCrudApiQueueItem(supabase, item);

      if (processResult.success) {
        result.successful++;
        console.log(
          `✅ Successfully processed CRUD API queue item ${item.id} (${item.entity_id == null ? 'repo-level' : `entity ${item.entity_id}`}, operation ${item.operation_key})`
        );
      } else {
        result.failed++;
        result.errors.push(
          `Queue item ${item.id}: ${processResult.error || 'Unknown error'}`
        );
        console.error(`❌ Failed CRUD API queue item ${item.id}:`, processResult.error);
      }
    } catch (error) {
      result.failed++;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(`Queue item ${item.id}: ${errorMessage}`);
      console.error(`❌ Error processing CRUD API queue item ${item.id}:`, error);
    }

    console.log(
      `CRUD API generation queue processing complete: ${result.successful} successful, ${result.failed} failed`
    );

    return result;
  } catch (error) {
    console.error('Error processing due CRUD API generation queue:', error);
    result.success = false;
    result.errors.push(
      error instanceof Error ? error.message : 'Unknown error'
    );
    return result;
  }
};
