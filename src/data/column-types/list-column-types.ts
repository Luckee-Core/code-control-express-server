import type { ColumnType } from '../../model/column-type';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Lists the column type vocabulary. (Storage Express invoke)
 */
export const listColumnTypes = async (client: CanonicalDataClient): Promise<ColumnType[]> =>
  invokeCanonicalDataOperation<ColumnType[]>(client, 'listColumnTypes', []);
