import type { SoftwareSystem } from '../../model/software-system';
import type { SoftwareSystemRepo } from '../../model/software-system-repo';

/** `Luckee-Core/my-health` or `https://github.com/x/my-health.git/` → `my-health`. */
export const toRepoKey = (value: string): string =>
  (value.trim().replace(/\/+$/, '').replace(/\.git$/i, '').split('/').filter(Boolean).pop() ?? '').toLowerCase();

const nameScore = (a: string, b: string): number => {
  const x = a.trim().toLowerCase();
  const y = b.trim().toLowerCase();
  if (!y) return 0;
  if (x === y) return 2;
  return x.includes(y) || y.includes(x) ? 1 : 0;
};

/**
 * Finds the software system for an ops project by repo name, ignoring the GitHub owner (repos move
 * between orgs). Most matching repos wins; ties go to the closer system name. Null when none match.
 */
export const resolveTicketBuildSystem = (input: {
  repoNames: string[];
  projectName: string | null;
  systems: SoftwareSystem[];
  repos: SoftwareSystemRepo[];
}): SoftwareSystem | null => {
  const wanted = new Set(input.repoNames.map(toRepoKey).filter(Boolean));
  if (wanted.size === 0) return null;
  const counts = new Map<string, number>();
  for (const repo of input.repos) {
    if (wanted.has(toRepoKey(repo.repo_url)) || wanted.has(toRepoKey(repo.name))) {
      counts.set(repo.software_system_id, (counts.get(repo.software_system_id) ?? 0) + 1);
    }
  }
  const projectName = input.projectName ?? '';
  return (
    input.systems
      .filter((system) => counts.has(system.id))
      .sort(
        (a, b) =>
          (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0) ||
          nameScore(b.name, projectName) - nameScore(a.name, projectName) ||
          a.name.localeCompare(b.name),
      )[0] ?? null
  );
};
