import type { ParsedOpsTrackerCrmPath } from './types';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Maps CRM proxy relative paths to my-ops storage gateway operations.
 */
export const parseOpsTrackerCrmPath = (rawPath: string): ParsedOpsTrackerCrmPath => {
  const pathOnly = rawPath.split('?')[0] ?? rawPath;
  const normalized = pathOnly.startsWith('/') ? pathOnly : `/${pathOnly}`;

  if (normalized === '/customers') {
    return { kind: 'listCustomers' };
  }
  if (normalized === '/projects' && !rawPath.includes('?')) {
    return { kind: 'listProjects' };
  }

  const projectMatch = normalized.match(/^\/projects\/([^/]+)$/);
  if (projectMatch && UUID_PATTERN.test(projectMatch[1])) {
    return { kind: 'getProjectById', id: projectMatch[1] };
  }

  const customerMatch = normalized.match(/^\/customers\/([^/]+)$/);
  if (customerMatch && UUID_PATTERN.test(customerMatch[1])) {
    return { kind: 'getCustomerById', id: customerMatch[1] };
  }

  const userMatch = normalized.match(/^\/users\/([^/]+)$/);
  if (userMatch && UUID_PATTERN.test(userMatch[1])) {
    return { kind: 'getUserById', id: userMatch[1] };
  }

  if (normalized === '/customer-contacts' || normalized.startsWith('/customer-contacts')) {
    const query = rawPath.includes('?') ? rawPath.slice(rawPath.indexOf('?') + 1) : '';
    const params = new URLSearchParams(query);
    const customerId = params.get('customerId')?.trim();
    if (customerId && UUID_PATTERN.test(customerId)) {
      return { kind: 'getCustomerContacts', customerId };
    }
    return { kind: 'unsupported', reason: 'Missing or invalid customerId query' };
  }

  return { kind: 'unsupported', reason: `Unsupported CRM path: ${rawPath}` };
};
