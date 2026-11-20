/**
 * A file as a fenced block, content exactly as-is (a newline is added before the closing fence only
 * when missing). The fence is one backtick longer than any backtick run in the file, so files that
 * contain ``` (ADRs, READMEs) can't end the block early.
 */
export const fenceFile = (path: string, content: string, language = path.split('.').pop() ?? ''): string => {
  const longest = Math.max(0, ...(content.match(/`+/g) ?? []).map((run) => run.length));
  const fence = '`'.repeat(Math.max(3, longest + 1));
  return `### ${path}\n${fence}${language}\n${content}${content.endsWith('\n') ? '' : '\n'}${fence}`;
};

/** Keeps the original file's trailing newline when an agent's rewrite drops (or adds) it by accident. */
export const keepTrailingNewline = (original: string | null | undefined, next: string): string => {
  if (original === null || original === undefined) return next;
  const had = original.endsWith('\n');
  if (had && !next.endsWith('\n')) return `${next}\n`;
  if (!had && next.endsWith('\n') && !original.endsWith('\n')) return next.replace(/\n+$/, '');
  return next;
};
