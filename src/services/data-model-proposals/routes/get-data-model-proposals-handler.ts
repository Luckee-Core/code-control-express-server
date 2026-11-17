import type { Request, Response } from 'express';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { processListDataModelProposals } from '../process-list-data-model-proposals';
import { sendProposalError } from './send-proposal-error';

/**
 * Handles GET /api/data/data-model-proposals?software_system_id=
 */
export const getDataModelProposalsHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;

  const softwareSystemId = typeof req.query.software_system_id === 'string' ? req.query.software_system_id.trim() : '';
  if (!softwareSystemId) {
    res.status(400).json({ success: false, error: 'software_system_id is required' });
    return;
  }
  try {
    const proposals = await processListDataModelProposals(client, softwareSystemId);
    res.status(200).json({ success: true, data: proposals });
  } catch (error) {
    sendProposalError(res, 'Error in GET /api/data/data-model-proposals', error);
  }
};
