import type { Request, Response } from 'express';
import { processGetHealth } from '../process-get-health';

/**
 * Handles GET / and GET /api/health (includes Storage Express + Postgres status).
 */
export const getHealthHandler = async (_req: Request, res: Response): Promise<void> => {
  try {
    const report = await processGetHealth();
    const unhealthy = report.storage === 'error' || report.database === 'error';
    res.status(unhealthy ? 503 : 200).json(report);
  } catch (error) {
    console.error('❌ Health check failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Health check failed',
    });
  }
};
