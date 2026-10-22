export type CustomerStage = 'discovery_call' | 'active' | 'inactive';

export type Customer = {
  id: string;
  name: string;
  description: string | null;
  stage: CustomerStage;
  created_at: string;
  updated_at: string;
};

export type GetAllCustomersParams = {
  stage?: string;
};

export type CreateCustomerInput = {
  name: string;
  description?: string | null;
  stage?: CustomerStage;
};
