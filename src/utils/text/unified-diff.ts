const MAX_DP_CELLS = 4_000_000;

/**
 * Line-based unified diff (`-` / `+` / ` ` prefixes, `@@` hunks with `context` lines). Trims the
 * common prefix and suffix, then runs an LCS on the middle; very large middles fall back to a
 * plain replace. Good enough for prompts and reviews, not a patch tool.
 */
export const unifiedDiff = (before: string, after: string, context = 3): string => {
  if (before === after) return '';
  const a = before.split('\n');
  const b = after.split('\n');
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start += 1;
  let endA = a.length - 1;
  let endB = b.length - 1;
  while (endA >= start && endB >= start && a[endA] === b[endB]) {
    endA -= 1;
    endB -= 1;
  }
  const midA = a.slice(start, endA + 1);
  const midB = b.slice(start, endB + 1);

  type Op = { kind: ' ' | '-' | '+'; text: string; lineA: number; lineB: number };
  const ops: Op[] = [];
  if (midA.length * midB.length > MAX_DP_CELLS) {
    midA.forEach((text, index) => ops.push({ kind: '-', text, lineA: start + index, lineB: -1 }));
    midB.forEach((text, index) => ops.push({ kind: '+', text, lineA: -1, lineB: start + index }));
  } else {
    const rows = midA.length + 1;
    const cols = midB.length + 1;
    const table = new Uint32Array(rows * cols);
    for (let i = midA.length - 1; i >= 0; i -= 1) {
      for (let j = midB.length - 1; j >= 0; j -= 1) {
        table[i * cols + j] = midA[i] === midB[j] ? table[(i + 1) * cols + j + 1] + 1 : Math.max(table[(i + 1) * cols + j], table[i * cols + j + 1]);
      }
    }
    let i = 0;
    let j = 0;
    while (i < midA.length || j < midB.length) {
      if (i < midA.length && j < midB.length && midA[i] === midB[j]) {
        ops.push({ kind: ' ', text: midA[i], lineA: start + i, lineB: start + j });
        i += 1;
        j += 1;
      } else if (j < midB.length && (i === midA.length || table[i * cols + j + 1] >= table[(i + 1) * cols + j])) {
        ops.push({ kind: '+', text: midB[j], lineA: -1, lineB: start + j });
        j += 1;
      } else {
        ops.push({ kind: '-', text: midA[i], lineA: start + i, lineB: -1 });
        i += 1;
      }
    }
  }

  const lead = a.slice(Math.max(0, start - context), start).map((text, index, list) => ({
    kind: ' ' as const,
    text,
    lineA: start - list.length + index,
    lineB: start - list.length + index,
  }));
  const tail = a.slice(endA + 1, endA + 1 + context).map((text, index) => ({
    kind: ' ' as const,
    text,
    lineA: endA + 1 + index,
    lineB: endB + 1 + index,
  }));
  const all = [...lead, ...ops, ...tail];
  const firstA = all.find((op) => op.lineA >= 0)?.lineA ?? start;
  const firstB = all.find((op) => op.lineB >= 0)?.lineB ?? start;
  const countA = all.filter((op) => op.kind !== '+').length;
  const countB = all.filter((op) => op.kind !== '-').length;
  return [`@@ -${firstA + 1},${countA} +${firstB + 1},${countB} @@`, ...all.map((op) => `${op.kind}${op.text}`)].join('\n');
};
