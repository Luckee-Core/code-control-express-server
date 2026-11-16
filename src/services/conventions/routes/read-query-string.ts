import type { Request } from 'express';

/**
 * Returns a trimmed string query param, or undefined when missing or repeated.
 */
export const readQueryString = (req: Request, name: string): string | undefined => {
  const value = req.query[name];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
};
