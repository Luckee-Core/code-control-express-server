import type { Request, Response } from 'express';
import { logHandlerError } from '../../../utils/http/log-handler-error';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { processDeleteConventionExample } from '../process-delete-convention-example';

/**
 * Handles DELETE /api/data/conventions/examples/:exampleId.
 */
export const deleteConventionExampleHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;

  const exampleId = req.params.exampleId;
  if (!exampleId || Array.isArray(exampleId)) {
    res.status(400).json({ success: false, error: 'Invalid example ID' });
    return;
  }

  console.log('📥 DELETE /api/data/conventions/examples/:exampleId', { exampleId });
  try {
    const result = await processDeleteConventionExample(client, exampleId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logHandlerError('Error in DELETE /api/data/conventions/examples/:exampleId', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};
