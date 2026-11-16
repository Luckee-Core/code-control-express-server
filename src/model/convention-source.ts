/** Row in convention_sources (provenance for a convention). */
export type ConventionSource = {
  id: string;
  convention_id: string;
  repo: string;
  adr_path: string;
  excerpt: string;
  copy_count: number | null;
  variant_count: number | null;
  created_at: string;
  updated_at: string;
};

export type CreateConventionSourceInput = {
  convention_id: string;
  repo: string;
  adr_path: string;
  excerpt?: string;
  copy_count?: number | null;
  variant_count?: number | null;
};
