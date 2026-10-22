import type { Request, Response } from 'express';
import type { RepoType } from '../../../model/project-repo';
import { requireStorageClient } from '../../../utils/http/require-storage-client';
import { parseGithubRepoUrl } from '../../../utils/parse-github-repo-url';
import { processLinkExistingRepo } from '../process-link-existing-repo';

const REPO_TYPES: RepoType[] = ['express', 'python', 'nextjs', 'react-native'];

/**
 * Handles POST /api/data/projects/:id/project-setup/link-existing-repo.
 */
export const postLinkExistingRepoHandler = async (req: Request, res: Response): Promise<void> => {
  const storage = requireStorageClient(res);
  if (!storage) return;

  const projectId = req.params.id;
  if (!projectId || Array.isArray(projectId)) {
    res.status(400).json({ success: false, error: 'Invalid project ID' });
    return;
  }

  const body = (req.body ?? {}) as { repo_type?: unknown; repo_url?: unknown };
  const repoType = REPO_TYPES.find((type) => type === body.repo_type);
  if (!repoType) {
    res.status(400).json({
      success: false,
      error: 'repo_type must be express, python, nextjs, or react-native',
    });
    return;
  }

  const repoUrlInput = typeof body.repo_url === 'string' ? body.repo_url.trim() : '';
  if (!repoUrlInput) {
    res.status(400).json({ success: false, error: 'repo_url is required' });
    return;
  }

  const parsed = parseGithubRepoUrl(repoUrlInput);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error });
    return;
  }

  console.log('📥 POST project-setup/link-existing-repo', { projectId, repoType });
  try {
    const result = await processLinkExistingRepo({
      storage,
      projectId,
      repoType,
      repo: { name: parsed.repo, repoUrl: parsed.repoUrl, cloneUrl: parsed.cloneUrl },
    });
    switch (result.kind) {
      case 'project_not_found':
        res.status(404).json({ success: false, error: 'Project not found' });
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
    console.error('❌ Error in POST project-setup/link-existing-repo:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};
