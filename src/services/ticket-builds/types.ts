import type { OpsTicketResearch } from '../../model/ops-ticket';
import type { TicketBuild } from '../../model/ticket-build';
import type { TicketBuildRepo } from '../../model/ticket-build-repo';

/** What the plan step knows about one repo. */
export type TicketBuildRepoContext = {
  repo: TicketBuildRepo;
  roleName: string;
  roleDescription: string;
  /** File paths at the default branch head (filtered and capped). */
  tree: string[];
  treeTruncated: boolean;
  /** Key docs that exist: path → text (capped). */
  docs: { path: string; text: string }[];
  /** Rendered conventions for the repo's role (all domains with rules for it). */
  conventionsText: string;
  /** Set when the repo could not be read (the plan still runs). */
  readError: string | null;
};

export type TicketBuildContext = {
  build: TicketBuild;
  systemName: string;
  research: OpsTicketResearch | null;
  repos: TicketBuildRepoContext[];
};
