/**
 * Sanitize a string to be safe for use in Git branch names
 * 
 * Rules:
 * - Convert to lowercase
 * - Replace spaces with hyphens
 * - Remove special characters (except hyphens)
 * - Remove leading/trailing hyphens
 * - Ensure it doesn't start with a hyphen
 * 
 * @param name - The string to sanitize
 * @returns A Git-safe branch name component
 */
export const sanitizeBranchName = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    // Replace spaces with hyphens
    .replace(/\s+/g, '-')
    // Remove invalid characters: ~, ^, :, ?, *, [, ], \, @{, //, ..
    .replace(/[~^:?*[\]\\@{}/.]+/g, '')
    // Replace multiple hyphens with single hyphen
    .replace(/-+/g, '-')
    // Remove leading hyphen
    .replace(/^-+/, '')
    // Remove trailing hyphen
    .replace(/-+$/, '')
    // If empty after sanitization, use 'unnamed'
    || 'unnamed';
};
