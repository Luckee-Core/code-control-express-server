import type { Request, Response } from 'express';
import { logHandlerError } from '../../../utils/http/log-handler-error';
import { processGetHealth } from '../process-get-health';

/**
 * Handles GET / and GET /api/health (includes Storage Express + Postgres status).
 */
export const getHealthHandler = async (_req: Request, res: Response): Promise<void> => {
  console.log('📥 [health.getHealthHandler] GET /api/health');
  try {
    const report = await processGetHealth();
    console.log('📤 [health.getHealthHandler] 200', {
      status: report.status,
      canonicalData: report.canonicalData,
      database: report.database,
    });
    res.status(200).json(report);
  } catch (error) {
    logHandlerError('Health check failed', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Health check failed',
    });
  }
};
