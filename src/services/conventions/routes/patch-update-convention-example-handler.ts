import type { Request, Response } from 'express';
import { logHandlerError } from '../../../utils/http/log-handler-error';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { processUpdateConventionExample } from '../process-update-convention-example';

/**
 * Handles PATCH /api/data/conventions/examples/:exampleId.
 */
export const patchUpdateConventionExampleHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;

  const exampleId = req.params.exampleId;
  if (!exampleId || Array.isArray(exampleId)) {
    res.status(400).json({ success: false, error: 'Invalid example ID' });
    return;
  }
  const { title, kind, language, path_hint, code, note, sort_order } = req.body ?? {};

  console.log('📥 PATCH /api/data/conventions/examples/:exampleId', { exampleId });
  try {
    const example = await processUpdateConventionExample(client, exampleId, {
      ...(title !== undefined && { title }),
      ...(kind !== undefined && { kind }),
      ...(language !== undefined && { language }),
      ...(path_hint !== undefined && { path_hint }),
      ...(code !== undefined && { code }),
      ...(note !== undefined && { note }),
      ...(sort_order !== undefined && { sort_order }),
    });
    res.status(200).json({ success: true, data: example });
  } catch (error) {
    logHandlerError('Error in PATCH /api/data/conventions/examples/:exampleId', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};
