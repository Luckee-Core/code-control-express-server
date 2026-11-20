/**
 * Codegen manifest: lives in each template repo at codegen/manifest.json and declares every file
 * Code Control generates for that repo role. Templates (Eta) live next to it under codegen/.
 * Code Control only builds the data each template receives; the code shape is in the template repo.
 */

export type CodegenKind = 'model' | 'crud';

/** once = one render; table = one per table; operation = one per table operation. */
export type ManifestEach = 'once' | 'table' | 'operation';

/**
 * How a merge decides that a table (scope tables) or the whole block (scope once) is already in
 * the file. Strings are Eta templates rendered with the table context.
 */
export type ManifestPresence =
  | { contains: string }
  | { regex: string }
  /** Present when the rendered `item` of the merge's rewrite_list step is already in the list. */
  | { in_list: true };

export type ManifestMergeStep =
  /** Adds one rendered line per missing table after the last top-level import (skips lines already there). */
  | { op: 'add_imports'; line: string }
  /** Inserts one rendered line per missing table before the last occurrence of `marker`. */
  | { op: 'insert_before_last'; marker: string; line: string; error: string }
  /** Inserts the rendered `block` at the start of the line holding the first marker (in list order) found. */
  | { op: 'insert_before_line_containing'; markers: string[]; block: string; error: string }
  /** Inserts the rendered lines (one per missing table, no separator) right after the first regex match. */
  | { op: 'insert_after_regex'; pattern: string; line: string; error: string }
  /**
   * Rewrites a list captured by `pattern` (3 groups: before, items, after), appending the missing
   * tables' rendered `item`. inline: `before + items.join(', ') + after`; lines: one rendered `line`
   * per item (`it.item`) between newlines. Without `error`, a missing list skips the file silently.
   */
  | { op: 'rewrite_list'; pattern: string; item: string; format: 'inline' | 'lines'; line?: string; error?: string }
  /** Appends one rendered line per missing table to the end of the file (trailing whitespace normalized). */
  | { op: 'append_lines'; line: string };

export type ManifestMerge = {
  /** error = finding; skip = no file; create = render `create_template` with every table; empty = merge into ''. */
  on_missing_file: 'error' | 'skip' | 'create' | 'empty';
  missing_file_error?: string;
  create_template?: string;
  scope: 'once' | 'tables';
  present?: ManifestPresence;
  steps: ManifestMergeStep[];
};

export type ManifestFile = {
  /** Stable id, used in findings and for mapping output paths back to templates. */
  id: string;
  /** Output path (Eta template). */
  path: string;
  each: ManifestEach;
  /** each = operation: only these operation kinds. */
  operation_kinds?: string[];
  /** write = always (re)write; if_missing = only when the repo lacks the file; merge = edit the existing file. */
  mode: 'write' | 'if_missing' | 'merge';
  /** Template path relative to codegen/ (write / if_missing). */
  template?: string;
  /** Copy the template as-is (no Eta). */
  raw?: boolean;
  /** Skip the file when the rendered content is empty or whitespace. */
  skip_if_empty?: boolean;
  merge?: ManifestMerge;
  /** Conventions this template implements (shown on template PRs and in convergence checks). */
  convention_keys?: string[];
  /** Convention key on merge findings (default codegen.wiring). */
  error_convention_key?: string;
};

export type CodegenManifest = {
  version: 1;
  role: string;
  kinds: Partial<Record<CodegenKind, { files: ManifestFile[] }>>;
};

/** A loaded template set: a repo at one commit (or a local directory for tests). */
export type TemplateSource = {
  /** owner/repo, or `local:<dir>` */
  repo: string;
  sha: string;
  manifest: CodegenManifest;
  /** Paths relative to codegen/ → content. */
  files: Map<string, string>;
};

/** What the target repo already has (read before rendering). */
export type CodegenRepoState = {
  /** Every path on the default branch; null when unknown (all writes count as create). */
  paths: Set<string> | null;
  /** Contents of the files the manifest merges into (null = missing). */
  files: Record<string, string | null>;
};
