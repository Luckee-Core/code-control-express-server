import { Request, Response } from 'express';
import { processAllQueues } from '../../services/code-generation/orchestrator';

/**
 * Process all code generation queues in parallel
 * 
 * POST /api/cron/process-all-queues
 * Called by Supabase cron job every 10 minutes
 */
export const processAllQueuesHandler = async (req: Request, res: Response) => {
  try {
    console.log('📥 Cron job triggered: process-all-queues');

    const result = await processAllQueues();

    res.json({
      success: result.success,
      ard: result.ard,
      entities: result.entities,
      crudApi: result.crudApi,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('❌ Error in process-all-queues:', err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};
