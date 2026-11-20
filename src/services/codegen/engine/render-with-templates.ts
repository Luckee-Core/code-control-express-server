import { Eta } from 'eta';
import type { CodegenRole, RenderedFile, RenderFinding } from '../types';
import { applyMerge } from './apply-merge';
import { itemContext, type CodegenContext } from './build-codegen-context';
import type { CodegenKind, CodegenRepoState, ManifestFile, TemplateSource } from './types';

/** A rendered file plus the manifest entry that produced it. */
export type EngineRenderedFile = RenderedFile & { manifest_id: string; template: string | null; convention_keys: string[] };

export type EngineRenderResult = { files: EngineRenderedFile[]; findings: RenderFinding[] };

/** Thrown when the template repo has no usable codegen for a role/kind, or a template fails to render. */
export class CodegenTemplateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CodegenTemplateError';
  }
}

const createEta = (): Eta => new Eta({ autoEscape: false, autoTrim: false, useWith: false, cache: true });

/**
 * Output paths of a kind's merge entries (the existing files the render needs to read).
 * Merge paths are rendered with the base context, so they never depend on repo state.
 */
export const renderMergePaths = (source: TemplateSource, kind: CodegenKind, context: CodegenContext): string[] => {
  const eta = createEta();
  const paths = (source.manifest.kinds[kind]?.files ?? [])
    .filter((entry) => entry.mode === 'merge')
    .map((entry) => {
      try {
        return eta.renderString(entry.path, context);
      } catch (error) {
        throw new CodegenTemplateError(`${source.repo} ${entry.id} path: ${error instanceof Error ? error.message : error}`);
      }
    });
  return [...new Set(paths)];
};

/**
 * Renders one kind (model | crud) for one role from a template source: every manifest entry is
 * rendered per its `each`, written / written-if-missing / merged into the repo's existing file.
 * Merges that can't find their anchor come back as error findings instead of guessed edits.
 */
export const renderWithTemplates = (input: {
  source: TemplateSource;
  kind: CodegenKind;
  role: CodegenRole;
  context: CodegenContext;
  state: CodegenRepoState;
}): EngineRenderResult => {
  const { source, kind, role, context, state } = input;
  const entries = source.manifest.kinds[kind]?.files;
  if (!entries) {
    throw new CodegenTemplateError(`${source.repo} codegen/manifest.json has no "${kind}" templates`);
  }

  const eta = createEta();
  const compiled = new Map<string, string>();
  const named = (template: string): string => {
    let name = compiled.get(template);
    if (!name) {
      name = `@t${compiled.size}`;
      eta.loadTemplate(name, template);
      compiled.set(template, name);
    }
    return name;
  };
  const renderString = (template: string, data: object, where: string): string => {
    try {
      return eta.render(named(template), data);
    } catch (error) {
      throw new CodegenTemplateError(`${source.repo}@${source.sha.slice(0, 7)} ${where}: ${error instanceof Error ? error.message : error}`);
    }
  };
  const templateText = (entry: ManifestFile, path: string | undefined): string => {
    if (!path) throw new CodegenTemplateError(`${source.repo} manifest entry ${entry.id} has no template`);
    const text = source.files.get(path);
    if (text === undefined) throw new CodegenTemplateError(`${source.repo} is missing codegen/${path} (manifest entry ${entry.id})`);
    return text;
  };

  const files: EngineRenderedFile[] = [];
  const findings: RenderFinding[] = [];
  const seen = new Map<string, number>();
  const exists = (path: string): boolean =>
    state.paths ? state.paths.has(path) : state.files[path] !== undefined && state.files[path] !== null;

  const push = (entry: ManifestFile, path: string, content: string, action: RenderedFile['action']) => {
    const file: EngineRenderedFile = {
      role,
      path,
      content,
      action,
      manifest_id: entry.id,
      template: entry.template ?? entry.merge?.create_template ?? null,
      convention_keys: entry.convention_keys ?? [],
    };
    const previous = seen.get(path);
    if (previous === undefined) {
      seen.set(path, files.length);
      files.push(file);
    } else {
      files[previous] = file; // later entries win (e.g. a merge after a create)
    }
  };

  for (const entry of entries) {
    if (entry.mode === 'merge') {
      const merge = entry.merge;
      if (!merge) throw new CodegenTemplateError(`${source.repo} manifest entry ${entry.id} has mode merge but no merge spec`);
      const path = renderString(entry.path, context, `${entry.id} path`);
      const existing = state.files[path] ?? null;
      const findingFor = (message: string) =>
        findings.push({
          severity: 'error',
          role,
          path,
          message: `${message}. Wire it by hand.`,
          convention_key: entry.error_convention_key ?? 'codegen.wiring',
        });

      if (existing === null) {
        if (merge.on_missing_file === 'skip') continue;
        if (merge.on_missing_file === 'error') {
          findingFor(merge.missing_file_error ?? `${path} not found`);
          continue;
        }
        if (merge.on_missing_file === 'create') {
          const template = templateText(entry, merge.create_template);
          push(entry, path, renderString(template, context, entry.id), 'create');
          continue;
        }
      }

      const outcome = applyMerge({
        merge,
        existing: existing ?? '',
        tableCount: context.tables.length,
        render: (template, tableIndex, extra) =>
          renderString(
            template,
            { ...(tableIndex === null ? context : itemContext(context, context.tables[tableIndex], tableIndex)), ...(extra ?? {}) },
            `${entry.id} merge`,
          ),
      });
      if ('error' in outcome) findingFor(outcome.error);
      if ('content' in outcome) push(entry, path, outcome.content, existing === null ? 'create' : 'update');
      continue;
    }

    const template = templateText(entry, entry.template);
    const render = (data: object, where: string): void => {
      const path = renderString(entry.path, data, `${entry.id} path`);
      if (entry.mode === 'if_missing' && exists(path)) return;
      const content = entry.raw ? template : renderString(template, data, where);
      if (entry.skip_if_empty && content.trim() === '') return;
      push(entry, path, content, exists(path) ? 'update' : 'create');
    };

    if (entry.each === 'once') {
      render(context, entry.id);
    } else {
      context.tables.forEach((crud, index) => {
        if (entry.each === 'table') {
          render(itemContext(context, crud, index), `${entry.id} (${crud.names.table})`);
          return;
        }
        for (const op of crud.operations) {
          if (entry.operation_kinds && !entry.operation_kinds.includes(op.kind)) continue;
          render(itemContext(context, crud, index, op), `${entry.id} (${crud.names.table}.${op.name})`);
        }
      });
    }
  }

  return { files, findings };
};
