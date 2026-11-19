import type { Request, Response } from 'express';
import { sendHandlerError } from '../../../utils/http/send-handler-error';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { ASSIGNABLE_REPO_ROLES } from '../config';
import { processUpdateRepoRole } from '../process-update-repo-role';

/**
 * Handles PATCH /api/data/software-systems/:id/software-system-setup/repos/:repoId/role { role | null }.
 */
export const patchRepoRoleHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;

  const projectId = typeof req.params.id === 'string' ? req.params.id : '';
  const repoId = typeof req.params.repoId === 'string' ? req.params.repoId : '';
  const body = (req.body ?? {}) as { role?: unknown };
  const role = body.role === null || body.role === '' ? null : typeof body.role === 'string' ? body.role : undefined;
  if (!projectId || !repoId || role === undefined) {
    res.status(400).json({ success: false, error: 'project id, repo id and role (string or null) are required' });
    return;
  }
  if (role !== null && !(ASSIGNABLE_REPO_ROLES as readonly string[]).includes(role)) {
    res.status(400).json({ success: false, error: `role must be one of ${ASSIGNABLE_REPO_ROLES.join(', ')}` });
    return;
  }

  console.log('📥 PATCH software-system-setup/repos/:repoId/role', { projectId, repoId, role });
  try {
    const repo = await processUpdateRepoRole(client, { projectId, repoId, role });
    if (!repo) {
      res.status(404).json({ success: false, error: 'Repo not found in this project' });
      return;
    }
    res.status(200).json({ success: true, data: repo });
  } catch (error) {
    sendHandlerError(res, 'Error in PATCH software-system-setup/repos/:repoId/role', error);
  }
};
