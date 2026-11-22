/** Row in software_systems. */
export type SoftwareSystem = {
  id: string;
  customer_id: string;
  name: string;
  description: string | null;
  is_active?: boolean;
  /** setup_presets.key chosen at creation (null for projects created before types existed). */
  setup_preset_key?: string | null;
  /** Loopback ports assigned for the project dispatcher (dispatcher delivery); null until assigned. */
  dispatcher_port?: number | null;
  dispatcher_storage_port?: number | null;
  dispatcher_api_port?: number | null;
  dispatcher_web_port?: number | null;
  created_at: string;
  updated_at: string;
};

export type CreateSoftwareSystemInput = {
  customer_id: string;
  name: string;
  description?: string | null;
  setup_preset_key?: string | null;
};

export type UpdateSoftwareSystemInput = {
  name?: string;
  description?: string | null;
  setup_preset_key?: string | null;
  dispatcher_port?: number | null;
  dispatcher_storage_port?: number | null;
  dispatcher_api_port?: number | null;
  dispatcher_web_port?: number | null;
};
