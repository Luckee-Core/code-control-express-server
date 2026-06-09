/**
 * Project setup router: create repos from template, list repos.
 * Mount at /projects/:id/project-setup (req.params.id = projectId).
 */

import { Router, Request, Response } from 'express';
import { getManagedSupabaseClient } from '../../db/supabase-client';
import { getProjectById } from '../projects/get-by-id';
import {
  getProjectReposByProjectId,
  getAllProjectRepos,
  insertProjectRepo,
  updateProjectRepoPhase,
  type RepoType,
} from '../project-repos';
import { createRepoFromTemplate } from '../../services/github';
import { getGithubOrgOptions, resolveGithubOwner } from '../../utils/github';
import { generateCode } from './generate-code';

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

function parseTemplateEnv(envValue: string | undefined): { owner: string; repo: string } | null {
  if (!envValue || !envValue.trim()) return null;
  const parts = envValue.trim().split('/');
  if (parts.length !== 2) return null;
  return { owner: parts[0], repo: parts[1] };
}

export const createProjectSetupRouter = (): Router => {
  const router = Router({ mergeParams: true });

  router.get('/github-orgs', async (req: Request, res: Response): Promise<void> => {
    try {
      const projectId = req.params.id as string;
      if (!projectId || Array.isArray(projectId)) {
        res.status(400).json({ success: false, error: 'Invalid project ID' });
        return;
      }

      const template = parseTemplateEnv(process.env.GITHUB_TEMPLATE_EXPRESS);
      if (!template) {
        res.status(500).json({
          success: false,
          error: 'GITHUB_TEMPLATE_EXPRESS is not set (expected owner/repo)',
        });
        return;
      }

      const orgOptions = getGithubOrgOptions(template.owner);
      res.status(200).json({ success: true, data: orgOptions });
    } catch (error) {
      console.error('Error in GET project-setup/github-orgs:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  });

  router.get('/repos', async (req: Request, res: Response): Promise<void> => {
    try {
      const projectId = req.params.id as string;
      if (!projectId || Array.isArray(projectId)) {
        res.status(400).json({ success: false, error: 'Invalid project ID' });
        return;
      }
      const supabase = getManagedSupabaseClient();
      const repos = await getProjectReposByProjectId(supabase, projectId);
      res.status(200).json({ success: true, data: repos, count: repos.length });
    } catch (error) {
      console.error('Error in GET project-setup/repos:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  });

  const handleCreateRepo = async (
    req: Request,
    res: Response,
    repoType: RepoType,
    templateEnvKey: string,
    namePattern: string
  ): Promise<void> => {
    try {
      const projectId = req.params.id as string;
      if (!projectId || Array.isArray(projectId)) {
        res.status(400).json({ success: false, error: 'Invalid project ID' });
        return;
      }
      const supabase = getManagedSupabaseClient();
      const project = await getProjectById(supabase, projectId);
      if (!project) {
        res.status(404).json({ success: false, error: 'Project not found' });
        return;
      }

      const template = parseTemplateEnv(process.env[templateEnvKey]);
      if (!template) {
        res.status(500).json({
          success: false,
          error: `${templateEnvKey} is not set (expected owner/repo)`,
        });
        return;
      }

      const body = (req.body as { slug?: string; name?: string; owner?: string }) || {};
      const nameOverride = typeof body.name === 'string' ? body.name.trim() : undefined;
      const slugOverride = typeof body.slug === 'string' ? body.slug.trim() : undefined;
      const ownerOverride = typeof body.owner === 'string' ? body.owner.trim() : undefined;
      const slug =
        slugOverride !== undefined && slugOverride !== ''
          ? slugify(slugOverride)
          : slugify(project.name) || `project-${projectId.slice(0, 8)}`;
      const newRepoName =
        repoType === 'nextjs' && nameOverride !== undefined && nameOverride !== ''
          ? slugify(nameOverride)
          : namePattern.replace('{slug}', slug);

      const existing = await getProjectReposByProjectId(supabase, projectId);
      const already =
        repoType === 'nextjs'
          ? existing.find((r) => r.name === newRepoName)
          : existing.find((r) => r.repo_type === repoType);
      if (already) {
        res.status(200).json({
          success: true,
          already_done: true,
          repo_url: already.repo_url,
        });
        return;
      }

      let newRepoOwner: string;
      try {
        newRepoOwner = resolveGithubOwner(ownerOverride, template.owner);
      } catch (ownerError) {
        res.status(400).json({
          success: false,
          error: ownerError instanceof Error ? ownerError.message : 'Invalid GitHub owner',
        });
        return;
      }

      const result = await createRepoFromTemplate({
        templateOwner: template.owner,
        templateRepo: template.repo,
        newRepoOwner,
        newRepoName,
        description: project.description || undefined,
        private: true,
      });

      if (!result.success) {
        res.status(400).json({ success: false, error: result.error });
        return;
      }

      await insertProjectRepo(supabase, {
        customer_id: project.customer_id,
        project_id: projectId,
        repo_type: repoType,
        name: newRepoName,
        repo_url: result.repo_url,
        clone_url: result.clone_url,
      });

      res.status(200).json({
        success: true,
        repo_url: result.repo_url,
        clone_url: result.clone_url,
      });
    } catch (error) {
      console.error(`Error in POST project-setup/create-${repoType}-repo:`, error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  };

  router.post('/create-express-repo', (req: Request, res: Response): void => {
    void handleCreateRepo(req, res, 'express', 'GITHUB_TEMPLATE_EXPRESS', '{slug}-express-server');
  });

  router.post('/create-web-repo', (req: Request, res: Response): void => {
    const pattern = process.env.PROJECT_SETUP_REPO_NAME_WEB?.trim() || '{slug}-web';
    void handleCreateRepo(req, res, 'nextjs', 'GITHUB_TEMPLATE_WEB', pattern);
  });

  router.post('/generate-code', (req: Request, res: Response): void => {
    void generateCode(req, res);
  });

  router.patch('/repos/:repoId', async (req: Request, res: Response): Promise<void> => {
    try {
      const projectId = req.params.id as string;
      const repoId = req.params.repoId as string;
      const { current_phase, phase_status } = req.body as {
        current_phase?: string | null;
        phase_status?: string | null;
      };
      if (!projectId || Array.isArray(projectId) || !repoId || Array.isArray(repoId)) {
        res.status(400).json({ success: false, error: 'Invalid project ID or repo ID' });
        return;
      }
      const supabase = getManagedSupabaseClient();
      const repos = await getProjectReposByProjectId(supabase, projectId);
      const repo = repos.find((r) => r.id === repoId);
      if (!repo) {
        res.status(404).json({ success: false, error: 'Repo not found' });
        return;
      }
      const updated = await updateProjectRepoPhase(supabase, repoId, {
        current_phase,
        phase_status,
      });
      res.status(200).json({ success: true, data: updated });
    } catch (error) {
      console.error('Error in PATCH project-setup/repos/:repoId:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  });

  return router;
};