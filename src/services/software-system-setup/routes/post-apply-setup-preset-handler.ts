import type { Request, Response } from 'express';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { sendHandlerError } from '../../../utils/http/send-handler-error';
import { processApplySetupPreset } from '../process-apply-setup-preset';

/**
 * Handles POST /api/data/software-systems/:id/software-system-setup/apply-preset { preset_key, owner? }.
 * Responds 200 with one result per role (created / already_done / template_missing / failed).
 */
export const postApplySetupPresetHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;

  const projectId = typeof req.params.id === 'string' ? req.params.id : '';
  const body = (req.body ?? {}) as { preset_key?: unknown; owner?: unknown };
  const presetKey = typeof body.preset_key === 'string' ? body.preset_key.trim() : '';
  const owner = typeof body.owner === 'string' && body.owner.trim() ? body.owner.trim() : undefined;
  if (!projectId || !presetKey) {
    res.status(400).json({ success: false, error: 'project id and preset_key are required' });
    return;
  }

  console.log('📥 POST software-system-setup/apply-preset', { projectId, presetKey });
  try {
    const result = await processApplySetupPreset(client, { projectId, presetKey, owner });
    if (result.kind === 'project_not_found') {
      res.status(404).json({ success: false, error: 'Software system not found' });
      return;
    }
    if (result.kind === 'preset_not_found') {
      res.status(400).json({ success: false, error: `Unknown project type: ${presetKey}` });
      return;
    }
    res.status(200).json({ success: true, data: { preset_key: result.preset.key, results: result.results } });
  } catch (error) {
    sendHandlerError(res, 'Error in POST software-system-setup/apply-preset', error);
  }
};
