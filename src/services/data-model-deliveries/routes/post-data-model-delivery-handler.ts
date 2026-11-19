import type { Request, Response } from 'express';
import { requireDataClient } from '../../../utils/http/require-data-client';
import type { CodegenRole } from '../../codegen';
import { sendProposalError } from '../../data-model-proposals/routes/send-proposal-error';
import { DELIVERY_ROLES } from '../config';
import { processDeliverDataModel } from '../process-deliver-data-model';

/**
 * Handles POST /api/data/data-model-deliveries { proposal_id, roles?, auto_merge? }: one PR per repo,
 * squash-merged when auto_merge is true; repos already merged for this version are skipped.
 */
export const postDataModelDeliveryHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;
  const body = (req.body ?? {}) as { proposal_id?: unknown; roles?: unknown; auto_merge?: unknown };
  const autoMerge = body.auto_merge === true;
  const proposalId = typeof body.proposal_id === 'string' ? body.proposal_id.trim() : '';
  const roles = Array.isArray(body.roles)
    ? DELIVERY_ROLES.filter((role) => (body.roles as unknown[]).includes(role))
    : undefined;
  if (!proposalId || (roles && roles.length === 0)) {
    res.status(400).json({ success: false, error: `proposal_id is required; roles must be some of ${DELIVERY_ROLES.join(', ')}` });
    return;
  }
  console.log('📥 POST /api/data/data-model-deliveries', { proposalId, roles: roles ?? 'all', autoMerge });
  try {
    const targets = await processDeliverDataModel(client, { proposalId, roles: roles as CodegenRole[] | undefined, autoMerge });
    res.status(200).json({ success: true, data: targets });
  } catch (error) {
    sendProposalError(res, 'Error in POST /api/data/data-model-deliveries', error);
  }
};
