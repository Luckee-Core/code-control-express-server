/** Row in customer_projects (API route is /projects). */
export type Project = {
  id: string;
  customer_id: string;
  name: string;
  description: string | null;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateProjectInput = {
  customer_id: string;
  name: string;
  description?: string | null;
};

export type UpdateProjectInput = {
  name?: string;
  description?: string | null;
};
