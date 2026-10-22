import type { NextFunction, Request, Response } from 'express';

/**
 * Blocks temp migration routes unless TEMP_MIGRATION_ENABLED=true.
 */
export const requireTempMigrationEnabledMiddleware = (
  _req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const enabled = process.env.TEMP_MIGRATION_ENABLED?.trim().toLowerCase() === 'true';
  if (!enabled) {
    res.status(404).json({ success: false, error: 'Not found' });
    return;
  }
  next();
};
