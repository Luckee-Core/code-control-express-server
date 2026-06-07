/**
 * Live Supabase queue tables use customer_project_id; API contract uses project_id.
 */

type QueueRow = Record<string, unknown> & {
  project_id?: string;
  customer_project_id?: string;
};

/**
 * Normalize a queue row so API consumers always receive project_id.
 */
export const normalizeQueueProjectId = <T extends QueueRow>(
  row: T
): T & { project_id: string } => {
  const projectId = String(row.project_id ?? row.customer_project_id ?? '');
  return { ...row, project_id: projectId };
};

/**
 * Normalize queue rows for list responses.
 */
export const normalizeQueueProjectIds = <T extends QueueRow>(
  rows: T[]
): (T & { project_id: string })[] => rows.map(normalizeQueueProjectId);

/**
 * DB column for project FK on customer-centric queue tables.
 */
export const CUSTOMER_QUEUE_PROJECT_ID_COLUMN = 'customer_project_id';

/**
 * Fields to insert for customer-centric queue tables.
 */
export const queueProjectIdInsertFields = (
  projectId: string
): { customer_project_id: string } => ({
  customer_project_id: projectId,
});
