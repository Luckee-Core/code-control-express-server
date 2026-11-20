import type { AgentRunFinding } from '../../model/agent-run';
import { checkRenderedFiles, type CodegenRole, type FileCheckConvention } from '../codegen';

type TypeScriptModule = typeof import('typescript');

let typescript: TypeScriptModule | null | undefined;

/** typescript is a dev dependency; when it isn't installed the syntax check is skipped. */
const loadTypeScript = (): TypeScriptModule | null => {
  if (typescript !== undefined) return typescript;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    typescript = require('typescript') as TypeScriptModule;
  } catch {
    typescript = null;
  }
  return typescript;
};

/** Syntax errors in a .ts/.tsx file (transpile only: no type checking). */
export const syntaxErrors = (path: string, content: string): string[] => {
  if (!/\.(ts|tsx)$/.test(path)) return [];
  const ts = loadTypeScript();
  if (!ts) return [];
  const result = ts.transpileModule(content, {
    fileName: path,
    reportDiagnostics: true,
    compilerOptions: { jsx: ts.JsxEmit.Preserve, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  });
  return (result.diagnostics ?? []).map((diagnostic) => {
    const text = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
    if (diagnostic.file && diagnostic.start !== undefined) {
      const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
      return `line ${line + 1}:${character + 1} ${text}`;
    }
    return text;
  });
};

/**
 * Deterministic checks on files an agent wrote: TS syntax plus the file_path conventions for the
 * role. `known` paths are the ones the agent was allowed to touch without a warning.
 */
export const checkEditedFiles = (input: {
  role: string | null;
  files: Array<{ path: string; content: string }>;
  checks: FileCheckConvention[];
  known?: Set<string>;
}): AgentRunFinding[] => {
  const findings: AgentRunFinding[] = [];
  if (loadTypeScript() === null) {
    findings.push({ severity: 'warning', path: '', message: 'TypeScript is not installed on the server, so syntax was not checked.', convention_key: 'agent.syntax' });
  }
  for (const file of input.files) {
    for (const error of syntaxErrors(file.path, file.content)) {
      findings.push({ severity: 'error', path: file.path, message: `Syntax: ${error}`, convention_key: 'agent.syntax' });
    }
    if (input.known && !input.known.has(file.path)) {
      findings.push({ severity: 'warning', path: file.path, message: 'New file that was not part of this PR.', convention_key: 'agent.scope' });
    }
  }
  if (input.role === 'storage' || input.role === 'express' || input.role === 'web') {
    const role = input.role as CodegenRole;
    const rendered = input.files.map((file) => ({ role, path: file.path, content: file.content, action: 'update' as const }));
    for (const finding of checkRenderedFiles(rendered, input.checks)) {
      findings.push({ severity: finding.severity, path: finding.path, message: finding.message, convention_key: finding.convention_key });
    }
  }
  return findings;
};
