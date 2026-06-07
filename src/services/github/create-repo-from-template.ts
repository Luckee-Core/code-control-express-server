/**
 * Create a new GitHub repository from a template using the GitHub API.
 * Uses GITHUB_PERSONAL_ACCESS_TOKEN env var. Template repo must have is_template enabled.
 */

export type CreateRepoFromTemplateInput = {
  templateOwner: string;
  templateRepo: string;
  newRepoOwner: string;
  newRepoName: string;
  description?: string;
  private?: boolean;
};

export type CreateRepoFromTemplateResult =
  | { success: true; repo_url: string; clone_url: string }
  | { success: false; error: string };

export const createRepoFromTemplate = async (
  input: CreateRepoFromTemplateInput
): Promise<CreateRepoFromTemplateResult> => {
  const token = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
  if (!token) {
    return { success: false, error: 'GITHUB_PERSONAL_ACCESS_TOKEN is not set' };
  }

  const { templateOwner, templateRepo, newRepoOwner, newRepoName, description, private: isPrivate } = input;
  const url = `https://api.github.com/repos/${templateOwner}/${templateRepo}/generate`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      owner: newRepoOwner,
      name: newRepoName,
      description: description ?? undefined,
      private: isPrivate ?? true,
    }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { message?: string };
    const message = body.message || response.statusText;
    return { success: false, error: `GitHub API (${response.status}): ${message}` };
  }

  const data = (await response.json()) as { html_url?: string; clone_url?: string };
  const repo_url = data.html_url ?? `https://github.com/${newRepoOwner}/${newRepoName}`;
  const clone_url = data.clone_url ?? `https://github.com/${newRepoOwner}/${newRepoName}.git`;

  return { success: true, repo_url, clone_url };
};
