import type { SoftwareSystemRepo } from '../../model/software-system-repo';

/**
 * The repo's role: its repo_roles key, else inferred from repo_type and name (storage repos are
 * often typed `express`; dispatcher/console repos are recognized by name).
 */
export const resolveTicketBuildRole = (repo: SoftwareSystemRepo): string => {
  if (repo.role) return repo.role;
  const name = repo.name.toLowerCase();
  switch (repo.repo_type) {
    case 'storage-express':
      return 'storage';
    case 'react-native':
      return 'mobile';
    case 'python':
      return 'python';
    case 'nextjs':
      if (name.includes('dispatcher')) return 'dispatcher-web';
      if (name.includes('console')) return 'console';
      return 'web';
    default:
      if (name.includes('storage') || name.includes('code-generator-storage')) return 'storage';
      if (name.includes('dispatcher')) return 'dispatcher';
      return 'express';
  }
};
