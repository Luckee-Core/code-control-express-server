/**
 * Sanitize a string for use as a Git branch name.
 * Git branch names cannot contain: spaces, ~, ^, :, ?, *, [, ], \, .., @{, //
 * Cannot start with -, end with /, .lock, or ., or be named 'HEAD'
 */
export const sanitizeBranchName = (input: string): string => {
  const invalidChars = /[\s~^:?*\[\]\\@{\/\.]+/g;
  let sanitized = input.replace(invalidChars, '-').replace(/-+/g, '-');
  sanitized = sanitized.replace(/^-|-$/g, '');
  if (!sanitized || sanitized.toLowerCase() === 'head') {
    return 'branch';
  }
  return sanitized;
};
