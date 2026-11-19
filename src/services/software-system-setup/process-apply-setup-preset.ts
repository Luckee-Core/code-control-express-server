import { listRepoRoles } from '../../data/repo-roles';
import { listSetupPresets } from '../../data/setup-presets';
import { getSoftwareSystemReposBySoftwareSystemId, updateSoftwareSystemRepoRole } from '../../data/software-system-repos';
import { getSoftwareSystemById, updateSoftwareSystem } from '../../data/software-systems';
import type { RepoRole } from '../../model/repo-role';
import type { SetupPreset, SetupPresetRepoResult } from '../../model/setup-preset';
import type { RepoType } from '../../model/software-system-repo';
import type { CanonicalDataClient } from '../canonical-data-client';
import { processCreateRepoFromTemplate } from './process-create-repo-from-template';
import type { RepoTemplateConfig } from './types';

export type ApplySetupPresetResult =
  | { kind: 'project_not_found' }
  | { kind: 'preset_not_found' }
  | { kind: 'applied'; preset: SetupPreset; results: SetupPresetRepoResult[] };

const configForRole = (role: RepoRole): RepoTemplateConfig | null =>
  role.template_env_key
    ? {
        repoType: role.repo_type as RepoType,
        role: role.key,
        templateEnvKey: role.template_env_key,
        readNamePattern: () => role.name_pattern,
      }
    : null;

/**
 * Records the project's type and creates a GitHub repo from its template for every role the
 * type lists (repo_roles gives the template env key, name pattern and repo type). Roles that
 * already have a repo are skipped, so re-applying only fills the gaps. One role failing never
 * stops the others; each gets its own result.
 */
export const processApplySetupPreset = async (
  client: CanonicalDataClient,
  input: { projectId: string; presetKey: string; owner?: string },
): Promise<ApplySetupPresetResult> => {
  const [project, presets, roles] = await Promise.all([
    getSoftwareSystemById(client, input.projectId),
    listSetupPresets(client),
    listRepoRoles(client),
  ]);
  if (!project) return { kind: 'project_not_found' };
  const preset = presets.find((candidate) => candidate.key === input.presetKey && candidate.is_active);
  if (!preset) return { kind: 'preset_not_found' };

  if (project.setup_preset_key !== preset.key) {
    await updateSoftwareSystem(client, project.id, { setup_preset_key: preset.key });
  }

  const results: SetupPresetRepoResult[] = [];
  for (const roleKey of preset.role_keys) {
    const role = roles.find((candidate) => candidate.key === roleKey);
    const roleName = role?.name ?? roleKey;
    const base = { role: roleKey, role_name: roleName };

    const repos = await getSoftwareSystemReposBySoftwareSystemId(client, project.id);
    const existing = repos.find((repo) => repo.role === roleKey);
    if (existing) {
      results.push({ ...base, status: 'already_done', repo_name: existing.name, repo_url: existing.repo_url, error: null });
      continue;
    }

    const config = role ? configForRole(role) : null;
    if (!config) {
      results.push({ ...base, status: 'template_missing', repo_name: null, repo_url: null, error: `No template is configured for the ${roleName} role` });
      continue;
    }

    try {
      console.log('🚀 [apply-setup-preset] Creating repo', { projectId: project.id, role: roleKey });
      const created = await processCreateRepoFromTemplate({ client, projectId: project.id, config, body: { owner: input.owner } });
      switch (created.kind) {
        case 'created':
          results.push({ ...base, status: 'created', repo_name: null, repo_url: created.repo_url, error: null });
          break;
        case 'already_done': {
          // Same repo name already linked without a role (created before roles existed): tag it.
          const sameName = (await getSoftwareSystemReposBySoftwareSystemId(client, project.id)).find(
            (repo) => repo.repo_url === created.repo_url,
          );
          if (sameName && !sameName.role) await updateSoftwareSystemRepoRole(client, sameName.id, roleKey);
          results.push({ ...base, status: 'already_done', repo_name: sameName?.name ?? null, repo_url: created.repo_url, error: null });
          break;
        }
        case 'template_missing':
          results.push({ ...base, status: 'template_missing', repo_name: null, repo_url: null, error: created.error });
          break;
        case 'invalid_request':
          results.push({ ...base, status: 'failed', repo_name: null, repo_url: null, error: created.error });
          break;
        case 'project_not_found':
          return { kind: 'project_not_found' };
      }
    } catch (error) {
      results.push({ ...base, status: 'failed', repo_name: null, repo_url: null, error: error instanceof Error ? error.message : String(error) });
    }
  }

  console.log('✅ [apply-setup-preset] Done', {
    projectId: project.id,
    preset: preset.key,
    statuses: results.map((result) => `${result.role}:${result.status}`),
  });
  return { kind: 'applied', preset, results };
};
