/**
 * Normalizes customer name for matching (trim, lowercase, collapse whitespace).
 */
export const normalizeCustomerName = (name: string): string => {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
};
