import type { Response } from 'express';
import { getManagedCanonicalDataClient, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Returns the managed canonical data client or sends 500 when unavailable.
 */
export const requireDataClient = (res: Response): CanonicalDataClient | null => {
  const client = getManagedCanonicalDataClient();
  if (!client) {
    console.error('❌ Canonical data client unavailable');
    res.status(500).json({
      success: false,
      error:
        'Canonical data not configured (gateway: MAIN_GATEWAY_URL + MAIN_GATEWAY_PROJECT_ID + DISPATCHER_GATE_SECRET; studio direct: CODE_CONTROL_DIRECT_URL + CODE_CONTROL_DIRECT_SECRET)',
    });
    return null;
  }
  return client;
};
