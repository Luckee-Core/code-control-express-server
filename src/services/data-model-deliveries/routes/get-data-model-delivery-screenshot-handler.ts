import type { Request, Response } from 'express';
import { requireDataClient } from '../../../utils/http/require-data-client';
import type { CodegenRole } from '../../codegen';
import { sendProposalError } from '../../data-model-proposals/routes/send-proposal-error';
import { ALL_DELIVERY_ROLES, readDeliveryKind } from '../config';
import { processScreenshotDataModelDelivery } from '../process-screenshot-data-model-delivery';

/**
 * Handles GET /api/data/data-model-deliveries/screenshot?proposal_id=&role=&kind= (PNG of the template preview page)
 */
export const getDataModelDeliveryScreenshotHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;
  const proposalId = typeof req.query.proposal_id === 'string' ? req.query.proposal_id.trim() : '';
  const role = ALL_DELIVERY_ROLES.find((candidate) => candidate === req.query.role) as CodegenRole | undefined;
  const kind = readDeliveryKind(req.query.kind);
  if (!proposalId || !role || !kind) {
    res.status(400).json({ success: false, error: `proposal_id and role (${ALL_DELIVERY_ROLES.join(', ')}) are required` });
    return;
  }
  console.log('📥 GET /api/data/data-model-deliveries/screenshot', { proposalId, role });
  try {
    const screenshot = await processScreenshotDataModelDelivery(client, { proposalId, role, kind });
    res.status(200).json({ success: true, data: screenshot });
  } catch (error) {
    sendProposalError(res, 'Error in GET /api/data/data-model-deliveries/screenshot', error);
  }
};
