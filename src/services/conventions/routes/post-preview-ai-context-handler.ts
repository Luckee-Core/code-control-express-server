import type { Request, Response } from 'express';
import { logHandlerError } from '../../../utils/http/log-handler-error';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { processBuildAiContext } from '../process-build-ai-context';
import { readRequiredKeys } from './read-required-keys';

/**
 * Handles POST /api/data/conventions/ai-context/preview.
 */
export const postPreviewAiContextHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;

  const keys = readRequiredKeys(req);
  if (!keys) {
    res.status(400).json({ success: false, error: 'domain_key and role_key are required' });
    return;
  }

  console.log('📥 POST /api/data/conventions/ai-context/preview', keys);
  try {
    const context = await processBuildAiContext(client, keys);
    res.status(200).json({ success: true, data: context });
  } catch (error) {
    logHandlerError('Error in POST /api/data/conventions/ai-context/preview', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};
