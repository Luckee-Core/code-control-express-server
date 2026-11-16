import type { ColumnType } from '../../model/column-type';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Lists data-model column types. (Storage Express `listColumnTypes`)
 */
export const listColumnTypes = async (
  client: CanonicalDataClient
): Promise<ColumnType[]> => invokeCanonicalDataOperation<ColumnType[]>(client, 'listColumnTypes', []);
