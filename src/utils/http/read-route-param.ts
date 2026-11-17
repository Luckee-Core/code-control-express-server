import type { Request } from 'express';

/**
 * Reads a single string route param (null when missing or repeated).
 */
export const readRouteParam = (req: Request, name: string): string | null => {
  const value = req.params[name];
  return typeof value === 'string' && value.trim() ? value : null;
};
