import { listTicketBuildsByOpsTicketId, listTicketBuildsBySoftwareSystemId } from '../../data/ticket-builds';
import type { TicketBuild } from '../../model/ticket-build';
import type { CanonicalDataClient } from '../canonical-data-client';

/** Lists builds for a software system or for one ops ticket, newest first. */
export const processListTicketBuilds = async (
  client: CanonicalDataClient,
  filter: { softwareSystemId: string } | { opsTicketId: string },
): Promise<TicketBuild[]> =>
  'softwareSystemId' in filter
    ? listTicketBuildsBySoftwareSystemId(client, filter.softwareSystemId)
    : listTicketBuildsByOpsTicketId(client, filter.opsTicketId);
