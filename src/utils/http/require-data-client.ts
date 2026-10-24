import type { Response } from 'express';
import {
  describeCanonicalDataConfigGap,
  getManagedCanonicalDataClient,
  type CanonicalDataClient,
} from '../../services/canonical-data-client';

/**
 * Returns the managed canonical data client or sends 500 when unavailable.
 */
export const requireDataClient = (res: Response): CanonicalDataClient | null => {
  const client = getManagedCanonicalDataClient();
  if (!client) {
    const gap = describeCanonicalDataConfigGap();
    console.error(`❌ Canonical data client unavailable${gap ? `: ${gap}` : ''}`);
    res.status(500).json({
      success: false,
      error: gap ?? 'Canonical data client is not configured',
    });
    return null;
  }
  return client;
};
