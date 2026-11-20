import type {
  AgentKind,
  AgentRun,
  AgentRunStatus,
  AiExchangeSummary,
  ConventionChangePropagation,
  PrAgentEdit,
  TemplateChange,
} from '../../model/agent-run';
import type { Convention } from '../../model/convention';
import type { ConventionChange } from '../../model/convention-change';
import type { DataModelDelivery } from '../../model/data-model-delivery';

/** List row: the run plus what the tables show next to it. */
export type AgentRunListItem = AgentRun & {
  software_system_name: string | null;
  delivery: Pick<DataModelDelivery, 'id' | 'repo_full_name' | 'pr_number' | 'pr_url' | 'role' | 'kind' | 'status'> | null;
  /** Template runs: one PR per template repo. */
  template_changes: Array<Pick<TemplateChange, 'id' | 'pr_number' | 'pr_url' | 'status' | 'repo_full_name'>>;
};

/** GET /api/data/agent-runs/:id */
export type AgentRunDetail = {
  run: AgentRun;
  software_system_name: string | null;
  /** Every version of this run (revise loop), oldest first. */
  versions: AgentRun[];
  /** Every run in the same chain (PR → convention → template), oldest first. */
  lineage: AgentRun[];
  parent: AgentRun | null;
  /** Runs this run handed off to (including template drafts that collected its changes). */
  children: AgentRun[];
  exchanges: AiExchangeSummary[];
  pr: { delivery: DataModelDelivery | null; edits: PrAgentEdit[] } | null;
  convention: {
    pr_run: AgentRun | null;
    pr_edits: PrAgentEdit[];
    changes: ConventionChange[];
    /** Current rows of the conventions the changes target or cite. */
    related: Array<Convention & { role_keys: string[] }>;
  } | null;
  template: {
    /** Template repos the run covers (from its propagation rows and PRs), sorted. */
    repos: string[];
    /** One PR per template repo that needed a change. */
    template_changes: TemplateChange[];
    changes: ConventionChange[];
    propagations: ConventionChangePropagation[];
  } | null;
};

/** GET /api/data/agent-runs/summary: per agent, how many runs are in each open status. */
export type AgentRunSummary = Record<AgentKind, Partial<Record<AgentRunStatus, number>> & { waiting: number }>;
