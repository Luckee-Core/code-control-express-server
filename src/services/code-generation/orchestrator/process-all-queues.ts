/**
 * Master Queue Orchestrator
 * Processes all code generation queues in parallel:
 * - ARD generation queue (1 task at a time)
 * - Entity generation queue (1 task at a time)
 * - CRUD API generation queue (1 task at a time)
 * 
 * Each queue processor handles its own rate limiting (LIMIT 1).
 * This orchestrator just triggers them all in parallel.
 */

import { getManagedSupabaseClient } from '../../../db/supabase-client';
import { processDueARDItems } from '../ards/queue/process-due-items';
import { processDueEntityItems } from '../entities/queue/process-due-items';
import { processDueCrudApiItems } from '../crud-api/queue/process-due-items';

export type ProcessAllQueuesResult = {
  success: boolean;
  ard: {
    processed: number;
    successful: number;
    failed: number;
    errors: string[];
  };
  entities: {
    processed: number;
    successful: number;
    failed: number;
    errors: string[];
  };
  crudApi: {
    processed: number;
    successful: number;
    failed: number;
    errors: string[];
  };
};

/**
 * Process all code generation queues in parallel.
 * Each queue processes 1 item at a time.
 */
export const processAllQueues = async (): Promise<ProcessAllQueuesResult> => {
  const supabase = getManagedSupabaseClient();

  console.log('🚀 Master orchestrator: Processing all code generation queues in parallel');

  const [ardResult, entityResult, crudApiResult] = await Promise.all([
    processDueARDItems(supabase),
    processDueEntityItems(supabase),
    processDueCrudApiItems(supabase),
  ]);

  const result: ProcessAllQueuesResult = {
    success: ardResult.success && entityResult.success && crudApiResult.success,
    ard: {
      processed: ardResult.processed,
      successful: ardResult.successful,
      failed: ardResult.failed,
      errors: ardResult.errors,
    },
    entities: {
      processed: entityResult.processed,
      successful: entityResult.successful,
      failed: entityResult.failed,
      errors: entityResult.errors,
    },
    crudApi: {
      processed: crudApiResult.processed,
      successful: crudApiResult.successful,
      failed: crudApiResult.failed,
      errors: crudApiResult.errors,
    },
  };

  console.log('✅ Master orchestrator complete:');
  console.log(`   ARD: ${result.ard.processed} processed (${result.ard.successful} successful, ${result.ard.failed} failed)`);
  console.log(`   Entities: ${result.entities.processed} processed (${result.entities.successful} successful, ${result.entities.failed} failed)`);
  console.log(`   CRUD API: ${result.crudApi.processed} processed (${result.crudApi.successful} successful, ${result.crudApi.failed} failed)`);

  return result;
};
