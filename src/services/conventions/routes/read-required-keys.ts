import type { Request } from 'express';

/**
 * Returns the AI context domain_key / role_key from the body, or null when either is missing.
 */
export const readRequiredKeys = (req: Request): { domain_key: string; role_key: string } | null => {
  const { domain_key, role_key } = req.body ?? {};
  if (typeof domain_key !== 'string' || !domain_key.trim() || typeof role_key !== 'string' || !role_key.trim()) {
    return null;
  }
  return { domain_key: domain_key.trim(), role_key: role_key.trim() };
};
