export type DataEntity = {
  id: string;
  project_id: string;
  name: string;
  table_name: string | null;
  description: string | null;
  sort_order: number;
  assigned_repo_ids: string[];
  created_at: string;
  updated_at: string;
};

export type DataEntityField = {
  id: string;
  entity_id: string;
  name: string;
  type: string;
  nullable: boolean;
  default_value: string | null;
  sort_order: number;
  references_entity_id: string | null;
  created_at: string;
  updated_at: string;
};

export type DataEntityWithFields = DataEntity & {
  fields: DataEntityField[];
};
