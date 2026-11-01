import type { Request, Response } from 'express';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { describeOpsTrackerGatewayConfigGap } from '../../ops-tracker-client';
import { processCompareCustomerOpsSync } from '../process-compare-customer-ops-sync';

/**
 * GET /compare — local vs Ops customers with suggestions.
 */
export const getCompareHandler = async (_req: Request, res: Response): Promise<void> => {
  console.log('📥 [customer-ops-sync] getCompareHandler');
  try {
    const gap = describeOpsTrackerGatewayConfigGap();
    if (gap) {
      res.status(503).json({ success: false, error: gap });
      return;
    }
    const client = requireDataClient(res);
    if (!client) return;

    const data = await processCompareCustomerOpsSync(client);
    console.log('📤 [customer-ops-sync] getCompareHandler');
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('❌ [customer-ops-sync] getCompareHandler', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Compare failed',
    });
  }
};
