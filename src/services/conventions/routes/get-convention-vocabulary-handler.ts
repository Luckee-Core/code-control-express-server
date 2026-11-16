import type { Request, Response } from 'express';
import { logHandlerError } from '../../../utils/http/log-handler-error';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { processGetConventionVocabulary } from '../process-get-convention-vocabulary';

/**
 * Handles GET /api/data/conventions/vocabulary.
 */
export const getConventionVocabularyHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;

  try {
    const vocabulary = await processGetConventionVocabulary(client);
    res.status(200).json({ success: true, data: vocabulary });
  } catch (error) {
    logHandlerError('Error in GET /api/data/conventions/vocabulary', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};
