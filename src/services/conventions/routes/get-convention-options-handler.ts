import type { Request, Response } from 'express';
import { logHandlerError } from '../../../utils/http/log-handler-error';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { processGetConventionOptions } from '../process-get-convention-options';

/**
 * Handles GET /api/data/conventions/options.
 */
export const getConventionOptionsHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;

  try {
    const options = await processGetConventionOptions(client);
    res.status(200).json({ success: true, data: options });
  } catch (error) {
    logHandlerError('Error in GET /api/data/conventions/options', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};
