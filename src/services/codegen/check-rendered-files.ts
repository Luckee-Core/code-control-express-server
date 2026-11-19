import type { Convention } from '../../model/convention';
import type { RenderedFile, RenderFinding } from './types';

/** An active file_path / sql convention plus the repo roles it applies to. */
export type FileCheckConvention = Pick<Convention, 'key' | 'severity' | 'check_kind' | 'check_config'> & {
  role_keys: string[];
};

const toRegExps = (patterns: unknown, flags = ''): RegExp[] =>
  Array.isArray(patterns)
    ? patterns
        .filter((pattern): pattern is string => typeof pattern === 'string')
        .flatMap((pattern) => {
          try {
            return [new RegExp(pattern, flags)];
          } catch {
            return [];
          }
        })
    : [];

/** Literal start of a `^…` pattern (e.g. `^src/data/[a-z]+` → `src/data/`). */
const literalPrefix = (pattern: RegExp): string => {
  const match = /^\^((?:[^\\[(.*+?{|$]|\\[^a-zA-Z0-9])*)/.exec(pattern.source);
  return (match?.[1] ?? '').replace(/\\(.)/g, '$1');
};

const REGEX_META = new Set([']', ')', '}', '+', '*', '?', '|', '[', '(', '{', '^']);

/**
 * Fixed file-name ending of a pattern (`…/router\.ts$` → `router.ts`, `…-handler\.ts$` → `-handler.ts`).
 * A pattern only covers files with that ending, so `src/services/x/router\.ts$` does not claim every
 * file under src/services. A literal `index.ts` ending (folder-per-entity) covers the whole folder.
 */
const literalSuffix = (pattern: RegExp): string => {
  const tail = pattern.source.slice(pattern.source.lastIndexOf('/') + 1).replace(/\$$/, '');
  let suffix = '';
  for (let index = tail.length - 1; index >= 0; index -= 1) {
    const char = tail[index];
    if (index > 0 && tail[index - 1] === '\\') {
      // \d, \w, \s… are classes, not literal characters.
      if (/[a-zA-Z0-9]/.test(char)) break;
      suffix = char + suffix;
      index -= 1;
      continue;
    }
    if (REGEX_META.has(char) || char === '.') break;
    suffix = char + suffix;
  }
  const isWholeTail = suffix.length > 0 && tail.replace(/\\(.)/g, '$1') === suffix;
  return isWholeTail && suffix === 'index.ts' ? '' : suffix;
};

const appliesTo =(convention: FileCheckConvention, file: RenderedFile): boolean => {
  const configRoles = convention.check_config?.roles;
  const roles = Array.isArray(configRoles) ? (configRoles as string[]) : convention.role_keys;
  return roles.length === 0 || roles.includes(file.role);
};

const severityOf = (convention: FileCheckConvention): RenderFinding['severity'] =>
  convention.severity === 'must' || convention.severity === 'never' ? 'error' : 'warning';

const checkPathPattern = (convention: FileCheckConvention, file: RenderedFile): string | null => {
  const patterns = toRegExps(convention.check_config?.patterns);
  const covering = patterns.filter((pattern) => {
    const prefix = literalPrefix(pattern);
    return prefix !== '' && file.path.startsWith(prefix) && file.path.endsWith(literalSuffix(pattern));
  });
  if (covering.length === 0) return null;
  // A barrel at the root of the covered folder (src/model/index.ts) is always allowed.
  if (covering.some((pattern) => file.path === `${literalPrefix(pattern)}index.ts`)) return null;
  if (covering.some((pattern) => pattern.test(file.path))) return null;
  return `Path does not match ${covering.map((pattern) => pattern.source).join(' or ')}`;
};

const checkPathForbidden = (convention: FileCheckConvention, file: RenderedFile): string | null => {
  const hit = toRegExps(convention.check_config?.patterns).find((pattern) => pattern.test(file.path));
  return hit ? `Path is not allowed here (${hit.source})` : null;
};

const checkSqlForbidden = (convention: FileCheckConvention, file: RenderedFile): string | null => {
  const hit = toRegExps(convention.check_config?.patterns, 'i').find((pattern) => pattern.test(file.content));
  return hit ? `SQL contains a forbidden construct (${hit.source})` : null;
};

const checkCreateIfNotExists = (file: RenderedFile): string | null => {
  const statements = file.content.match(/\bCREATE\s+(?:UNIQUE\s+)?(?:TABLE|INDEX)\b[^;]*/gi) ?? [];
  const bad = statements.find((statement) => !/\bIF\s+NOT\s+EXISTS\b/i.test(statement));
  return bad ? `Missing IF NOT EXISTS: ${bad.slice(0, 60)}…` : null;
};

/**
 * Runs the active file_path and sql conventions against rendered files. Unknown rules are skipped
 * so new conventions can be seeded before their check exists.
 */
export const checkRenderedFiles = (files: RenderedFile[], conventions: FileCheckConvention[]): RenderFinding[] => {
  const findings: RenderFinding[] = [];
  for (const file of files) {
    const isSql = file.path.endsWith('.sql');
    for (const convention of conventions) {
      if (!appliesTo(convention, file)) continue;
      const rule = convention.check_config?.rule;
      let message: string | null = null;
      if (convention.check_kind === 'file_path' && rule === 'path_pattern') message = checkPathPattern(convention, file);
      if (convention.check_kind === 'file_path' && rule === 'path_forbidden') message = checkPathForbidden(convention, file);
      if (convention.check_kind === 'sql' && isSql && rule === 'sql_forbidden') message = checkSqlForbidden(convention, file);
      if (convention.check_kind === 'sql' && isSql && rule === 'sql_create_if_not_exists') message = checkCreateIfNotExists(file);
      if (message) {
        findings.push({ severity: severityOf(convention), role: file.role, path: file.path, message, convention_key: convention.key });
      }
    }
  }
  return findings;
};
