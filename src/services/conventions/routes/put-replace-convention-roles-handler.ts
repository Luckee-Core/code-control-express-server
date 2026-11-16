import type { Request, Response } from 'express';
import { logHandlerError } from '../../../utils/http/log-handler-error';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { processReplaceConventionRoles } from '../process-replace-convention-roles';

/**
 * Handles PUT /api/data/conventions/:id/roles.
 */
export const putReplaceConventionRolesHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;

  const id = req.params.id;
  if (!id || Array.isArray(id)) {
    res.status(400).json({ success: false, error: 'Invalid convention ID' });
    return;
  }
  const { role_keys } = req.body ?? {};
  if (!Array.isArray(role_keys) || role_keys.some((k: unknown) => typeof k !== 'string')) {
    res.status(400).json({ success: false, error: 'role_keys must be an array of strings' });
    return;
  }

  console.log('📥 PUT /api/data/conventions/:id/roles', { id, count: role_keys.length });
  try {
    const roles = await processReplaceConventionRoles(client, id, role_keys);
    res.status(200).json({ success: true, data: roles });
  } catch (error) {
    logHandlerError('Error in PUT /api/data/conventions/:id/roles', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};
