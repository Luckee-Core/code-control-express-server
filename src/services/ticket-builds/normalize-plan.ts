import type { TicketBuildRepo } from '../../model/ticket-build-repo';
import { MAX_CONTRACT_CHARS, MAX_REPO_PLAN_CHARS } from './config';

export type NormalizedTicketBuildPlan = {
  summary: string;
  contract: string;
  missingRolesNote: string;
  repos: { id: string; included: boolean; planText: string }[];
  /** Things normalization fixed (logged). */
  notes: string[];
};

const text = (value: unknown, max: number): string => {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
};

/**
 * Validates the model's plan against the build's repos: unknown repo ids are dropped, duplicates keep
 * the first, every included repo gets a row (missing → no changes), text is trimmed and capped.
 * Excluded repos stay excluded. Pure.
 */
export const normalizeTicketBuildPlan = (json: unknown, repos: TicketBuildRepo[]): NormalizedTicketBuildPlan => {
  const root = (json && typeof json === 'object' ? json : {}) as Record<string, unknown>;
  const notes: string[] = [];
  const byId = new Map(repos.map((repo) => [repo.software_system_repo_id, repo]));
  const seen = new Map<string, { changes: boolean; plan: string }>();

  for (const raw of Array.isArray(root.repos) ? root.repos : []) {
    const item = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
    const id = typeof item.software_system_repo_id === 'string' ? item.software_system_repo_id.trim() : '';
    if (!byId.has(id)) {
      notes.push(`dropped plan for unknown repo id "${id}"`);
      continue;
    }
    if (seen.has(id)) {
      notes.push(`dropped duplicate plan for ${byId.get(id)?.repo_full_name}`);
      continue;
    }
    seen.set(id, { changes: item.changes_needed === true, plan: text(item.plan_markdown, MAX_REPO_PLAN_CHARS) });
  }

  return {
    summary: text(root.summary, 2000),
    contract: text(root.contract_markdown, MAX_CONTRACT_CHARS),
    missingRolesNote: text(root.missing_roles_note, 2000),
    repos: repos.map((repo) => {
      const entry = seen.get(repo.software_system_repo_id);
      if (!repo.included) return { id: repo.id, included: false, planText: repo.plan_text };
      if (!entry) {
        notes.push(`no plan returned for ${repo.repo_full_name}; marked no changes`);
        return { id: repo.id, included: false, planText: 'No changes planned for this repo.' };
      }
      return {
        id: repo.id,
        included: entry.changes && entry.plan.length > 0,
        planText: entry.plan || 'No changes planned for this repo.',
      };
    }),
    notes,
  };
};
