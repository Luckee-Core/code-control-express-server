import { listColumnTypes } from '../../data/column-types';
import { getDataModelDeliveryById } from '../../data/data-model-deliveries';
import { getDataModelProposalById } from '../../data/data-model-proposals';
import { listLifecycleOptions } from '../../data/lifecycle-options';
import { listStandardColumns } from '../../data/standard-columns';
import type { AgentRunFinding } from '../../model/agent-run';
import type { DataModelProposalContent } from '../../model/data-model-proposal';
import { syntaxErrors } from '../agent-runs/check-edited-files';
import type { CanonicalDataClient } from '../canonical-data-client';
import {
  buildCodegenContext,
  checkRenderedFiles,
  CodegenTemplateError,
  renderWithTemplates,
  type CodegenKind,
  type CodegenRole,
  type CodegenVocabulary,
  type FileCheckConvention,
  type TemplateSource,
} from '../codegen';
import { SAMPLE_DATA_MODELS } from '../codegen/sample-data-model';

export type SampleDataModel = { version: number; content: DataModelProposalContent; vocabulary: CodegenVocabulary; label: string };

const CODEGEN_ROLES = new Set(['storage', 'express', 'web']);

/** The data model to preview templates with: the originating delivery's approved model, else the built-in sample. */
export const loadSampleDataModel = async (client: CanonicalDataClient, deliveryId: string | null): Promise<SampleDataModel> => {
  const [columnTypes, standardColumns, lifecycleOptions] = await Promise.all([
    listColumnTypes(client),
    listStandardColumns(client),
    listLifecycleOptions(client),
  ]);
  const vocabulary: CodegenVocabulary = {
    column_types: columnTypes.filter((type) => type.is_active),
    standard_columns: standardColumns,
    lifecycle_options: lifecycleOptions,
  };
  if (deliveryId) {
    const delivery = await getDataModelDeliveryById(client, deliveryId);
    const proposal = delivery ? await getDataModelProposalById(client, delivery.proposal_id) : null;
    if (proposal?.proposal) {
      return { version: proposal.version, content: proposal.proposal, vocabulary, label: `data model v${proposal.version} (the project the feedback came from)` };
    }
  }
  const sample = SAMPLE_DATA_MODELS[0];
  return { version: sample.version, content: sample.content, vocabulary, label: 'built-in sample data model' };
};

/**
 * Renders every kind in a template source for a sample data model against an empty repo, and
 * reports template errors, convention check failures and syntax errors in the generated code.
 */
export const renderTemplateSample = (input: {
  source: TemplateSource;
  role: string | null;
  sample: SampleDataModel;
  checks: FileCheckConvention[];
}): { files: Array<{ kind: CodegenKind; path: string; content: string }>; findings: AgentRunFinding[] } => {
  if (!input.role || !CODEGEN_ROLES.has(input.role)) return { files: [], findings: [] };
  const role = input.role as CodegenRole;
  const files: Array<{ kind: CodegenKind; path: string; content: string }> = [];
  const findings: AgentRunFinding[] = [];
  for (const kind of Object.keys(input.source.manifest.kinds) as CodegenKind[]) {
    const state = { paths: new Set<string>(), files: {} };
    try {
      const context = buildCodegenContext({ role, kind, content: input.sample.content, vocabulary: input.sample.vocabulary, version: input.sample.version, state });
      const rendered = renderWithTemplates({ source: input.source, kind, role, context, state });
      for (const file of rendered.files) {
        files.push({ kind, path: file.path, content: file.content });
        for (const error of syntaxErrors(file.path, file.content).slice(0, 3)) {
          findings.push({ severity: 'error', path: file.path, message: `Generated code (${kind}) has a syntax error: ${error}`, convention_key: 'codegen.syntax' });
        }
      }
      for (const finding of checkRenderedFiles(rendered.files, input.checks)) {
        findings.push({ severity: finding.severity, path: finding.path, message: `Generated code (${kind}): ${finding.message}`, convention_key: finding.convention_key });
      }
    } catch (error) {
      const message = error instanceof CodegenTemplateError || error instanceof Error ? error.message : String(error);
      findings.push({ severity: 'error', path: 'codegen/manifest.json', message: `Rendering ${kind} failed: ${message}`, convention_key: 'codegen.template' });
    }
  }
  return { files, findings };
};
