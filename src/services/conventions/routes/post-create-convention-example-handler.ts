import type { Request, Response } from 'express';
import { logHandlerError } from '../../../utils/http/log-handler-error';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { processCreateConventionExample } from '../process-create-convention-example';

/**
 * Handles POST /api/data/conventions/:id/examples.
 */
export const postCreateConventionExampleHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;

  const id = req.params.id;
  if (!id || Array.isArray(id)) {
    res.status(400).json({ success: false, error: 'Invalid convention ID' });
    return;
  }
  const { title, kind, language, path_hint, code, note, sort_order } = req.body ?? {};
  if (typeof title !== 'string' || !title.trim() || !kind || !language || typeof code !== 'string' || !code.trim()) {
    res.status(400).json({ success: false, error: 'title, kind, language and code are required' });
    return;
  }

  console.log('📥 POST /api/data/conventions/:id/examples', { id });
  try {
    const example = await processCreateConventionExample(client, {
      convention_id: id,
      title: title.trim(),
      kind,
      language,
      code,
      ...(path_hint !== undefined && { path_hint }),
      ...(note !== undefined && { note }),
      ...(sort_order !== undefined && { sort_order }),
    });
    res.status(201).json({ success: true, data: example });
  } catch (error) {
    logHandlerError('Error in POST /api/data/conventions/:id/examples', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};
