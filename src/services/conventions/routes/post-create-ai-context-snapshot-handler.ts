import type { Request, Response } from 'express';
import { logHandlerError } from '../../../utils/http/log-handler-error';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { processCreateAiContextSnapshot } from '../process-create-ai-context-snapshot';
import { readRequiredKeys } from './read-required-keys';

/**
 * Handles POST /api/data/conventions/ai-context/snapshots.
 */
export const postCreateAiContextSnapshotHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;

  const keys = readRequiredKeys(req);
  if (!keys) {
    res.status(400).json({ success: false, error: 'domain_key and role_key are required' });
    return;
  }
  const { consumer_type, consumer_id, software_system_id } = req.body ?? {};
  const hasType = typeof consumer_type === 'string' && consumer_type.trim() !== '';
  const hasId = typeof consumer_id === 'string' && consumer_id.trim() !== '';
  if (hasType !== hasId) {
    res.status(400).json({ success: false, error: 'consumer_type and consumer_id must be sent together' });
    return;
  }

  console.log('📥 POST /api/data/conventions/ai-context/snapshots', { ...keys, consumer_type });
  try {
    const result = await processCreateAiContextSnapshot(client, {
      ...keys,
      ...(hasType && { consumer_type: consumer_type.trim(), consumer_id: consumer_id.trim() }),
      ...(typeof software_system_id === 'string' && software_system_id && { software_system_id }),
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logHandlerError('Error in POST /api/data/conventions/ai-context/snapshots', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};
