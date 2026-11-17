import type { Request, Response } from 'express';
import { readRouteParam } from '../../../utils/http/read-route-param';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { MAX_FEEDBACK_CHARS } from '../config';
import { processReviseDataModelProposal } from '../process-revise-data-model-proposal';
import { sendProposalError } from './send-proposal-error';

/**
 * Handles POST /api/data/data-model-proposals/:id/revise { feedback }.
 * Responds 202 with the new running version.
 */
export const postReviseDataModelProposalHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;

  const id = readRouteParam(req, 'id');
  const body = (req.body ?? {}) as Record<string, unknown>;
  const feedback = typeof body.feedback === 'string' ? body.feedback.trim() : '';
  if (!id || !feedback) {
    res.status(400).json({ success: false, error: 'Proposal id and feedback are required' });
    return;
  }
  if (feedback.length > MAX_FEEDBACK_CHARS) {
    res.status(400).json({ success: false, error: `feedback is limited to ${MAX_FEEDBACK_CHARS} characters` });
    return;
  }

  console.log('📥 POST /api/data/data-model-proposals/:id/revise', { id, feedback_chars: feedback.length });
  try {
    const proposal = await processReviseDataModelProposal(client, { proposalId: id, feedback });
    res.status(202).json({ success: true, data: proposal });
  } catch (error) {
    sendProposalError(res, 'Error in POST /api/data/data-model-proposals/:id/revise', error);
  }
};
