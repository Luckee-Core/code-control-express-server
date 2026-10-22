import type { Response } from 'express';
import type { Pool } from 'pg';
import { getManagedPgPool } from '../../services/postgres';

/**
 * Returns the managed Postgres pool or sends 500 when unavailable.
 */
export const requirePgPool = (res: Response): Pool | null => {
  const pool = getManagedPgPool();
  if (!pool) {
    console.error('❌ Postgres pool unavailable');
    res.status(500).json({ success: false, error: 'Service unavailable' });
    return null;
  }
  return pool;
};
