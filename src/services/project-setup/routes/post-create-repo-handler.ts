import type { Request, RequestHandler, Response } from 'express';
import { logHandlerError } from '../../../utils/http/log-handler-error';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { processCreateRepoFromTemplate } from '../process-create-repo-from-template';
import type { CreateRepoRequestBody, RepoTemplateConfig } from '../types';

const readOptionalString = (value: unknown): string | undefined =>
  typeof value === 'string' ? value : undefined;

/**
 * Builds the handler for POST /api/data/projects/:id/project-setup/create-{type}-repo.
 */
export const createPostCreateRepoHandler =
  (config: RepoTemplateConfig): RequestHandler =>
  async (req: Request, res: Response): Promise<void> => {
    const client = requireDataClient(res);
    if (!client) return;

    const projectId = req.params.id;
    if (!projectId || Array.isArray(projectId)) {
      res.status(400).json({ success: false, error: 'Invalid project ID' });
      return;
    }

    const rawBody = (req.body ?? {}) as Record<string, unknown>;
    const body: CreateRepoRequestBody = {
      slug: readOptionalString(rawBody.slug),
      name: readOptionalString(rawBody.name),
      owner: readOptionalString(rawBody.owner),
    };

    console.log(`📥 POST project-setup/create-${config.repoType}-repo`, { projectId });
    try {
      const result = await processCreateRepoFromTemplate({ client, projectId, config, body });
      switch (result.kind) {
        case 'project_not_found':
          res.status(404).json({ success: false, error: 'Project not found' });
          return;
        case 'template_missing':
          res.status(500).json({ success: false, error: result.error });
          return;
        case 'invalid_request':
          res.status(400).json({ success: false, error: result.error });
          return;
        case 'already_done':
          res.status(200).json({ success: true, already_done: true, repo_url: result.repo_url });
          return;
        case 'created':
          res.status(200).json({
            success: true,
            repo_url: result.repo_url,
            clone_url: result.clone_url,
          });
          return;
      }
    } catch (error) {
      logHandlerError(`Error in POST project-setup/create-${config.repoType}-repo`, error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  };
