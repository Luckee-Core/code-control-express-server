import type { Request, Response } from 'express';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { MAX_CONTEXT_CHARS } from '../config';
import { processCreateDataModelProposal } from '../process-create-data-model-proposal';
import { sendProposalError } from './send-proposal-error';

/**
 * Handles POST /api/data/data-model-proposals { software_system_id, context_text }.
 * Responds 202 with the running proposal; poll GET /:id until status leaves `running`.
 */
export const postCreateDataModelProposalHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;

  const body = (req.body ?? {}) as Record<string, unknown>;
  const softwareSystemId = typeof body.software_system_id === 'string' ? body.software_system_id.trim() : '';
  const contextText = typeof body.context_text === 'string' ? body.context_text.trim() : '';
  if (!softwareSystemId || !contextText) {
    res.status(400).json({ success: false, error: 'software_system_id and context_text are required' });
    return;
  }
  if (contextText.length > MAX_CONTEXT_CHARS) {
    res.status(400).json({ success: false, error: `context_text is limited to ${MAX_CONTEXT_CHARS} characters` });
    return;
  }

  console.log('📥 POST /api/data/data-model-proposals', {
    software_system_id: softwareSystemId,
    context_chars: contextText.length,
  });
  try {
    const proposal = await processCreateDataModelProposal(client, { softwareSystemId, contextText });
    res.status(202).json({ success: true, data: proposal });
  } catch (error) {
    sendProposalError(res, 'Error in POST /api/data/data-model-proposals', error);
  }
};
