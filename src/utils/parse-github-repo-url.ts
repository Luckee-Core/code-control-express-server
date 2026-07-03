/**
 * Parse a GitHub repository URL to extract owner, repo name, and normalized URLs.
 * Supports https://github.com/owner/repo and git@github.com:owner/repo.git formats.
 */

export type ParsedGithubRepoUrl =
  | {
      success: true;
      owner: string;
      repo: string;
      repoUrl: string;
      cloneUrl: string;
    }
  | { success: false; error: string };

export const parseGithubRepoUrl = (url: string): ParsedGithubRepoUrl => {
  if (!url || typeof url !== 'string') {
    return { success: false, error: 'Repository URL is required' };
  }

  const trimmed = url.trim();

  const httpsMatch = trimmed.match(
    /^https?:\/\/github\.com\/([^/]+)\/([^/\s#?.]+)/i
  );
  if (httpsMatch) {
    const owner = httpsMatch[1];
    const repo = httpsMatch[2].replace(/\.git$/i, '');
    if (!owner || !repo) {
      return { success: false, error: 'Invalid GitHub repository URL' };
    }
    return {
      success: true,
      owner,
      repo,
      repoUrl: `https://github.com/${owner}/${repo}`,
      cloneUrl: `https://github.com/${owner}/${repo}.git`,
    };
  }

  const sshMatch = trimmed.match(/^git@github\.com:([^/]+)\/([^/\s#?.]+)/i);
  if (sshMatch) {
    const owner = sshMatch[1];
    const repo = sshMatch[2].replace(/\.git$/i, '');
    if (!owner || !repo) {
      return { success: false, error: 'Invalid GitHub repository URL' };
    }
    return {
      success: true,
      owner,
      repo,
      repoUrl: `https://github.com/${owner}/${repo}`,
      cloneUrl: `https://github.com/${owner}/${repo}.git`,
    };
  }

  return {
    success: false,
    error: 'Enter a valid GitHub URL (e.g. https://github.com/owner/repo)',
  };
};
