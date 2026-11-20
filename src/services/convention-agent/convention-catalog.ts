import { listConventionDomains } from '../../data/convention-domains';
import { listConventionTopics } from '../../data/convention-topics';
import { listRepoRoles } from '../../data/repo-roles';
import type { Convention } from '../../model/convention';
import type { ConventionDomain } from '../../model/convention-domain';
import type { ConventionTopic } from '../../model/convention-topic';
import type { RepoRole } from '../../model/repo-role';
import { loadConventionCatalog } from '../agent-runs/load-role-conventions';
import type { CanonicalDataClient } from '../canonical-data-client';

/** Everything needed to compare and validate proposed convention changes. */
export type ConventionCatalog = {
  conventions: Array<Convention & { role_keys: string[] }>;
  byKey: Map<string, Convention & { role_keys: string[] }>;
  domains: ConventionDomain[];
  topics: ConventionTopic[];
  roles: RepoRole[];
};

export const loadCatalog = async (client: CanonicalDataClient): Promise<ConventionCatalog> => {
  const [conventions, domains, topics, roles] = await Promise.all([
    loadConventionCatalog(client),
    listConventionDomains(client),
    listConventionTopics(client),
    listRepoRoles(client),
  ]);
  return { conventions, byKey: new Map(conventions.map((convention) => [convention.key, convention])), domains, topics, roles };
};

/** Compact catalog text for the prompt: every rule with key, severity, status, roles and statement. */
export const formatCatalogForPrompt = (catalog: ConventionCatalog): string => {
  const lines: string[] = [];
  for (const domain of catalog.domains) {
    lines.push(`## Domain ${domain.key}: ${domain.name}`, domain.description, '');
    for (const topic of catalog.topics.filter((item) => item.domain_key === domain.key)) {
      lines.push(`### Topic ${topic.key}: ${topic.name}`);
      for (const convention of catalog.conventions.filter((item) => item.topic_key === topic.key)) {
        lines.push(
          `- \`${convention.key}\` [${convention.severity.toUpperCase()}${convention.status === 'active' ? '' : `, ${convention.status}`}] roles: ${convention.role_keys.join(', ') || 'all'} — ${convention.title}: ${convention.statement.replace(/\s+/g, ' ').trim()}`,
        );
      }
      lines.push('');
    }
  }
  lines.push('## Repo roles', ...catalog.roles.map((role) => `- ${role.key}: ${role.description}`));
  return lines.join('\n');
};
