import type { Request, Response } from 'express';
import { processGetGithubOrgs } from '../process-get-github-orgs';

/**
 * Handles GET /api/data/projects/:id/project-setup/github-orgs.
 */
export const getGithubOrgsHandler = (req: Request, res: Response): void => {
  const projectId = req.params.id;
  if (!projectId || Array.isArray(projectId)) {
    res.status(400).json({ success: false, error: 'Invalid project ID' });
    return;
  }

  try {
    res.status(200).json({ success: true, data: processGetGithubOrgs() });
  } catch (error) {
    console.error('❌ Error in GET project-setup/github-orgs:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};
