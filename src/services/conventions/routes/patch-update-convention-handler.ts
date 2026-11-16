import type { Request, Response } from 'express';
import { logHandlerError } from '../../../utils/http/log-handler-error';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { processUpdateConvention } from '../process-update-convention';

/**
 * Handles PATCH /api/data/conventions/:id.
 */
export const patchUpdateConventionHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;

  const id = req.params.id;
  if (!id || Array.isArray(id)) {
    res.status(400).json({ success: false, error: 'Invalid convention ID' });
    return;
  }
  const { topic_key, title, statement, rationale, severity, status, check_kind, check_config, sort_order } = req.body ?? {};

  console.log('📥 PATCH /api/data/conventions/:id', { id });
  try {
    const convention = await processUpdateConvention(client, id, {
      ...(topic_key !== undefined && { topic_key }),
      ...(title !== undefined && { title }),
      ...(statement !== undefined && { statement }),
      ...(rationale !== undefined && { rationale }),
      ...(severity !== undefined && { severity }),
      ...(status !== undefined && { status }),
      ...(check_kind !== undefined && { check_kind }),
      ...(check_config !== undefined && { check_config }),
      ...(sort_order !== undefined && { sort_order }),
    });
    res.status(200).json({ success: true, data: convention });
  } catch (error) {
    logHandlerError('Error in PATCH /api/data/conventions/:id', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};
