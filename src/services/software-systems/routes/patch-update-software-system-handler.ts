import type { Request, Response } from 'express';
import { logHandlerError } from '../../../utils/http/log-handler-error';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { processUpdateSoftwareSystem } from '../process-update-software-system';

/**
 * Handles PATCH /api/data/software-systems/:id.
 */
export const patchUpdateSoftwareSystemHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;

  const { id } = req.params;
  if (!id || Array.isArray(id)) {
    res.status(400).json({ success: false, error: 'Invalid customer project ID' });
    return;
  }
  const { name, description, setup_preset_key } = req.body ?? {};
  if (setup_preset_key !== undefined && setup_preset_key !== null && typeof setup_preset_key !== 'string') {
    res.status(400).json({ success: false, error: 'setup_preset_key must be a string or null' });
    return;
  }

  console.log('📥 PATCH /api/data/software-systems/:id', { id });
  try {
    const project = await processUpdateSoftwareSystem(client, id, {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(setup_preset_key !== undefined && { setup_preset_key }),
    });
    res.status(200).json({ success: true, data: project });
  } catch (error) {
    logHandlerError('Error in PATCH /api/data/software-systems/:id', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};
