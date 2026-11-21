import type { ManifestMerge, ManifestMergeStep, ManifestPresence } from './types';

/** Renders an Eta string for one table (index into the merge's table list) or for the whole merge (null). */
export type MergeRenderer = (template: string, tableIndex: number | null, extra?: Record<string, unknown>) => string;

export type MergeOutcome = { content: string } | { unchanged: true } | { skip: true } | { error: string };

/** Inserts lines after the last top-level `import …;` statement (or at the top), skipping ones already there. */
export const addImports = (source: string, lines: string[]): string => {
  const missing = lines.filter((line) => !source.includes(line));
  if (missing.length === 0) return source;
  const importRegex = /^import[\s\S]*?;[ \t]*$/gm;
  let lastEnd = -1;
  for (let match = importRegex.exec(source); match; match = importRegex.exec(source)) {
    lastEnd = match.index + match[0].length;
  }
  if (lastEnd === -1) return `${missing.join('\n')}\n${source}`;
  return `${source.slice(0, lastEnd)}\n${missing.join('\n')}${source.slice(lastEnd)}`;
};

const listItems = (raw: string, format: 'inline' | 'lines'): string[] =>
  format === 'inline'
    ? raw.split(',').map((item) => item.trim()).filter(Boolean)
    : Array.from(raw.matchAll(/'([^']+)'|"([^"]+)"/g)).map((item) => item[1] ?? item[2]);

const findListStep = (steps: ManifestMergeStep[]) =>
  steps.find((step): step is Extract<ManifestMergeStep, { op: 'rewrite_list' }> => step.op === 'rewrite_list');

/**
 * Applies a manifest merge to an existing file. `tableCount` is how many tables the merge covers
 * (1 for scope once). Returns new content, unchanged, skip (silently no file) or an error message.
 */
export const applyMerge = (input: {
  merge: ManifestMerge;
  existing: string;
  tableCount: number;
  render: MergeRenderer;
}): MergeOutcome => {
  const { merge, existing, render } = input;
  const indexes = merge.scope === 'once' ? [null] : Array.from({ length: input.tableCount }, (_, index) => index);
  const listStep = findListStep(merge.steps);

  // Which tables (or the single once-block) still need adding.
  let missing: Array<number | null>;
  const presence: ManifestPresence | undefined = merge.present;
  if (presence && 'in_list' in presence) {
    if (!listStep) return { error: 'manifest: present.in_list needs a rewrite_list step' };
    const match = new RegExp(listStep.pattern).exec(existing);
    if (!match) return listStep.error ? { error: listStep.error } : { skip: true };
    const listed = new Set(listItems(match[2], listStep.format));
    missing = indexes.filter((index) => !listed.has(render(listStep.item, index)));
  } else if (presence && 'contains' in presence) {
    missing = indexes.filter((index) => !existing.includes(render(presence.contains, index)));
  } else if (presence && 'regex' in presence) {
    missing = indexes.filter((index) => !new RegExp(render(presence.regex, index)).test(existing));
  } else {
    missing = indexes;
  }
  const skipIf = merge.skip_table_if;
  if (skipIf) missing = missing.filter((index) => index === null || render(skipIf, index).trim() !== 'true');
  if (missing.length === 0) return { unchanged: true };

  let content = existing;
  for (const step of merge.steps) {
    switch (step.op) {
      case 'add_imports':
        content = addImports(content, missing.map((index) => render(step.line, index)));
        break;
      case 'insert_before_last': {
        const at = content.lastIndexOf(step.marker);
        if (at === -1) return { error: step.error };
        const lines = missing.map((index) => render(step.line, index)).join('\n');
        content = `${content.slice(0, at)}${lines}\n${content.slice(at)}`;
        break;
      }
      case 'insert_before_line_containing': {
        const at = step.markers.map((marker) => content.indexOf(marker)).find((index) => index !== -1);
        if (at === undefined) return { error: step.error };
        const lineStart = content.lastIndexOf('\n', at) + 1;
        content = content.slice(0, lineStart) + render(step.block, null) + content.slice(lineStart);
        break;
      }
      case 'insert_after_regex': {
        const match = new RegExp(step.pattern).exec(content);
        if (!match) return { error: step.error };
        const insertAt = match.index + match[0].length;
        content = content.slice(0, insertAt) + missing.map((index) => render(step.line, index)).join('') + content.slice(insertAt);
        break;
      }
      case 'rewrite_list': {
        const match = new RegExp(step.pattern).exec(content);
        if (!match) return step.error ? { error: step.error } : { skip: true };
        const listed = listItems(match[2], step.format);
        const added = missing.map((index) => render(step.item, index)).filter((item) => !listed.includes(item));
        const items = step.format === 'inline' ? [...listed, ...added] : [...new Set([...listed, ...added])];
        const body =
          step.format === 'inline'
            ? items.join(', ')
            : `\n${items.map((item) => render(step.line ?? '<%= it.item %>', null, { item })).join('\n')}\n`;
        const replacement = `${match[1]}${body}${match[3]}`;
        content = content.slice(0, match.index) + replacement + content.slice(match.index + match[0].length);
        break;
      }
      case 'append_lines': {
        const base = content.trimEnd();
        const lines = missing.map((index) => render(step.line, index));
        content = `${base ? `${base}\n` : ''}${lines.join('\n')}\n`;
        break;
      }
    }
  }
  return content === existing ? { unchanged: true } : { content };
};
