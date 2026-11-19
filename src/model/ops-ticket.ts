/** My Ops Tracker ticket fields Code Control reads through the gateway (ops owns the table). */
export type OpsTicket = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  project_id: string | null;
  internal_project_id: string | null;
  tags: string[];
};

/** Latest completed ops Research for a ticket (summary + moving parts), used as planning input. */
export type OpsTicketResearch = {
  summary: string | null;
  parts: { layer: string; title: string; description: string; candidates: string[] }[];
};
