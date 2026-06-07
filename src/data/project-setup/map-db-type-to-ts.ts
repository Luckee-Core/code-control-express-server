/**
 * Map PostgreSQL database type to TypeScript type
 * 
 * @param dbType - PostgreSQL type (text, uuid, integer, boolean, timestamptz, etc.)
 * @returns TypeScript type string
 */
export const mapDbTypeToTs = (dbType: string): string => {
  const type = dbType.toLowerCase();
  
  if (type === 'text' || type === 'varchar' || type === 'char' || type === 'uuid') {
    return 'string';
  }
  
  if (type === 'integer' || type === 'bigint' || type === 'smallint' || type === 'numeric' || type === 'decimal' || type === 'real' || type === 'double precision') {
    return 'number';
  }
  
  if (type === 'boolean' || type === 'bool') {
    return 'boolean';
  }
  
  if (type === 'timestamptz' || type === 'timestamp' || type === 'date' || type === 'time') {
    return 'string'; // ISO string format
  }
  
  if (type === 'json' || type === 'jsonb') {
    return 'any'; // Could be more specific based on schema
  }
  
  // Default to string for unknown types
  return 'string';
};
