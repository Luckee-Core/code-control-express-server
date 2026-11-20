import type { Request, Response } from 'express';
import { logHandlerError } from '../../../utils/http/log-handler-error';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { processListSoftwareSystemAiCalls } from '../process-list-software-system-ai-calls';

/**
 * Handles GET /api/data/software-systems/:id/ai-calls — every AI call made for the system
 * (data model, ticket builds, agent runs) for the AI costs tab.
 */
export const getSoftwareSystemAiCallsHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;

  const { id } = req.params;
  if (!id || Array.isArray(id)) {
    res.status(400).json({ success: false, error: 'Invalid software system ID' });
    return;
  }

  try {
    const calls = await processListSoftwareSystemAiCalls(client, id);
    res.status(200).json({ success: true, data: calls });
  } catch (error) {
    logHandlerError('Error in GET /api/data/software-systems/:id/ai-calls', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};
