import type { Request, Response } from 'express';
import { logHandlerError } from '../../../utils/http/log-handler-error';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { processCreateConventionSource } from '../process-create-convention-source';

/**
 * Handles POST /api/data/conventions/:id/sources.
 */
export const postCreateConventionSourceHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;

  const id = req.params.id;
  if (!id || Array.isArray(id)) {
    res.status(400).json({ success: false, error: 'Invalid convention ID' });
    return;
  }
  const { repo, adr_path, excerpt, copy_count, variant_count } = req.body ?? {};
  if (typeof repo !== 'string' || !repo.trim() || typeof adr_path !== 'string' || !adr_path.trim()) {
    res.status(400).json({ success: false, error: 'repo and adr_path are required' });
    return;
  }

  console.log('📥 POST /api/data/conventions/:id/sources', { id });
  try {
    const source = await processCreateConventionSource(client, {
      convention_id: id,
      repo: repo.trim(),
      adr_path: adr_path.trim(),
      ...(excerpt !== undefined && { excerpt }),
      ...(copy_count !== undefined && { copy_count }),
      ...(variant_count !== undefined && { variant_count }),
    });
    res.status(201).json({ success: true, data: source });
  } catch (error) {
    logHandlerError('Error in POST /api/data/conventions/:id/sources', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};
