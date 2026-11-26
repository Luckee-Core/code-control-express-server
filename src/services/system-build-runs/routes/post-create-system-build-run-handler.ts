import type { Request, Response } from 'express';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { processCreateSystemBuildRun } from '../process-create-system-build-run';
import { sendSystemBuildError } from './send-system-build-error';

/**
 * Handles POST /api/data/system-build-runs { proposal_id }: starts "Build all" for an approved data
 * model. Responds 202; poll GET /:id.
 */
export const postCreateSystemBuildRunHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;
  const body = (req.body ?? {}) as { proposal_id?: unknown };
  const proposalId = typeof body.proposal_id === 'string' ? body.proposal_id.trim() : '';
  if (!proposalId) {
    res.status(400).json({ success: false, error: 'proposal_id is required' });
    return;
  }
  console.log('📥 POST /api/data/system-build-runs', { proposalId });
  try {
    const data = await processCreateSystemBuildRun(client, proposalId);
    res.status(202).json({ success: true, data });
  } catch (error) {
    sendSystemBuildError(res, 'Error in POST /api/data/system-build-runs', error);
  }
};
