export type CustomerStage = 'discovery_call' | 'active' | 'inactive';

export type CustomerStatus = 'pending_review' | 'active' | 'inactive';

/** Ops CRM customer (legacy local row shape during sync uses stage/description). */
export type Customer = {
  id: string;
  user_id?: string | null;
  name: string;
  status?: CustomerStatus;
  stage?: 'discovery_call' | 'active' | 'inactive';
  description?: string | null;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  facebook_url?: string | null;
  created_at: string;
  updated_at: string;
};

export type GetAllCustomersParams = {
  stage?: string;
};

export type CreateCustomerInput = {
  name: string;
  description?: string | null;
  stage?: 'discovery_call' | 'active' | 'inactive';
};
