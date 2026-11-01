import type { Request, Response } from 'express';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { describeOpsTrackerGatewayConfigGap } from '../../ops-tracker-client';
import { processApplyCustomerOpsSync } from '../process-apply-customer-ops-sync';
import type { CustomerOpsSyncApplyRequest } from '../types';

/**
 * POST /apply — link or create Ops customers and remap local FKs.
 */
export const postApplyHandler = async (req: Request, res: Response): Promise<void> => {
  console.log('📥 [customer-ops-sync] postApplyHandler');
  try {
    const gap = describeOpsTrackerGatewayConfigGap();
    if (gap) {
      res.status(503).json({ success: false, error: gap });
      return;
    }
    const client = requireDataClient(res);
    if (!client) return;

    const body = req.body as CustomerOpsSyncApplyRequest;
    if (!body?.decisions || !Array.isArray(body.decisions)) {
      res.status(400).json({ success: false, error: 'decisions array is required' });
      return;
    }

    const data = await processApplyCustomerOpsSync(client, body);
    const hasFailed = data.summary.failed > 0;
    console.log('📤 [customer-ops-sync] postApplyHandler', data.summary);
    res.status(200).json({
      success: !hasFailed,
      data,
      error: hasFailed ? 'One or more decisions failed' : undefined,
    });
  } catch (error) {
    console.error('❌ [customer-ops-sync] postApplyHandler', error);
    const message = error instanceof Error ? error.message : 'Apply failed';
    const status = message.includes('Expected') || message.includes('requires') ? 400 : 500;
    res.status(status).json({ success: false, error: message });
  }
};
