import type { Request, Response } from 'express';
import { requireDataClient } from '../../../utils/http/require-data-client';
import type { CodegenRole } from '../../codegen';
import { sendProposalError } from '../../data-model-proposals/routes/send-proposal-error';
import { DELIVERY_ROLES, readDeliveryKind } from '../config';
import { processPreviewDataModelDelivery } from '../process-preview-data-model-delivery';

/**
 * Handles GET /api/data/data-model-deliveries/preview?proposal_id=&role=&kind=model|crud
 */
export const getDataModelDeliveryPreviewHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;
  const proposalId = typeof req.query.proposal_id === 'string' ? req.query.proposal_id.trim() : '';
  const role = DELIVERY_ROLES.find((candidate) => candidate === req.query.role) as CodegenRole | undefined;
  const kind = readDeliveryKind(req.query.kind);
  if (!proposalId || !role || !kind) {
    res.status(400).json({ success: false, error: `proposal_id and role (${DELIVERY_ROLES.join(', ')}) are required` });
    return;
  }
  console.log('📥 GET /api/data/data-model-deliveries/preview', { proposalId, role });
  try {
    const preview = await processPreviewDataModelDelivery(client, { proposalId, role, kind });
    res.status(200).json({ success: true, data: preview });
  } catch (error) {
    sendProposalError(res, 'Error in GET /api/data/data-model-deliveries/preview', error);
  }
};
