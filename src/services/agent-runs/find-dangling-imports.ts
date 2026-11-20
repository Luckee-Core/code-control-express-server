import type { AgentRunFinding } from '../../model/agent-run';

const IMPORT_SPECIFIER = /(?:\bfrom\s+|\bimport\s*\(\s*|\brequire\s*\(\s*|^\s*import\s+)['"](\.{1,2}\/[^'"]+)['"]/gm;
const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

/** Normalizes `a/b/../c/./d` into `a/c/d`. */
const normalizePath = (path: string): string => {
  const parts: string[] = [];
  for (const part of path.split('/')) {
    if (part === '' || part === '.') continue;
    if (part === '..') parts.pop();
    else parts.push(part);
  }
  return parts.join('/');
};

/** Paths a relative import from `fromFile` could resolve to (with and without extension, or a folder index). */
const candidatePaths = (fromFile: string, specifier: string): string[] => {
  const directory = fromFile.includes('/') ? fromFile.slice(0, fromFile.lastIndexOf('/')) : '';
  const base = normalizePath(`${directory}/${specifier}`);
  return [base, ...SOURCE_EXTENSIONS.map((extension) => `${base}${extension}`), ...SOURCE_EXTENSIONS.map((extension) => `${base}/index${extension}`)];
};

/**
 * Error findings for files that still import a deleted file. `files` is what remains after the
 * edits (deleted files left out); only relative imports are resolved.
 */
export const findDanglingImports = (deleted: string[], files: Array<{ path: string; content: string }>): AgentRunFinding[] => {
  if (deleted.length === 0) return [];
  const gone = new Set(deleted);
  const findings: AgentRunFinding[] = [];
  for (const file of files) {
    if (!SOURCE_EXTENSIONS.some((extension) => file.path.endsWith(extension))) continue;
    for (const match of file.content.matchAll(IMPORT_SPECIFIER)) {
      const target = candidatePaths(file.path, match[1]).find((candidate) => gone.has(candidate));
      if (target) {
        findings.push({ severity: 'error', path: file.path, message: `Still imports ${target}, which this change deletes`, convention_key: 'agent.dangling_import' });
      }
    }
  }
  return findings;
};
