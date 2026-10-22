/**
 * Health Check Router
 * Provides endpoints for monitoring server health and status
 */

import { Router, Request, Response } from 'express';
import { getManagedPgPool } from '../postgres';

export const createHealthRouter = (): Router => {
  const router = Router();

  /**
   * GET /
   * Basic health check endpoint (includes Postgres when configured)
   */
  router.get('/', async (_req: Request, res: Response) => {
    const pool = getManagedPgPool();
    let database: 'ok' | 'unconfigured' | 'error' = 'unconfigured';

    if (pool) {
      try {
        await pool.query('SELECT 1');
        database = 'ok';
      } catch {
        database = 'error';
      }
    }

    const status = database === 'error' ? 'degraded' : 'ok';
    res.status(database === 'error' ? 503 : 200).json({
      status,
      message: 'Code Control Express Server is running',
      database,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    });
  });

  return router;
};
