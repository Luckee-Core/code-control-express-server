/** Row in software_systems. */
export type SoftwareSystem = {
  id: string;
  customer_id: string;
  name: string;
  description: string | null;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateSoftwareSystemInput = {
  customer_id: string;
  name: string;
  description?: string | null;
};

export type UpdateSoftwareSystemInput = {
  name?: string;
  description?: string | null;
};
