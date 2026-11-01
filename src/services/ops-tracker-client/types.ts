export type OpsTrackerGatewayConfig = {
  gatewayUrl: string;
  gatewayProjectId: string;
  gateSecret: string;
};

export type ParsedOpsTrackerCrmPath =
  | { kind: 'listCustomers' }
  | { kind: 'listProjects' }
  | { kind: 'getProjectById'; id: string }
  | { kind: 'getCustomerById'; id: string }
  | { kind: 'getCustomerContacts'; customerId: string }
  | { kind: 'getUserById'; id: string }
  | { kind: 'unsupported'; reason: string };

export type OpsTrackerJsonEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type OpsTrackerRequestResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; status: number };
