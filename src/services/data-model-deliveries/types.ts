import type { DataModelDelivery } from '../../model/data-model-delivery';
import type { SoftwareSystemRepo } from '../../model/software-system-repo';
import type { CodegenRole, RenderedFile, RenderFinding } from '../codegen';

/** One role's target repo and its delivery for a proposal (either may be missing). */
export type DeliveryTarget = {
  role: CodegenRole;
  repo: SoftwareSystemRepo | null;
  delivery: DataModelDelivery | null;
};

/** GET /api/data/data-model-deliveries/preview */
export type DeliveryPreview = {
  role: CodegenRole;
  repo_full_name: string;
  base_branch: string;
  files: RenderedFile[];
  findings: RenderFinding[];
  /** Template repo and commit the files were rendered with. */
  template: { repo: string; sha: string };
};

/** GET /api/data/data-model-deliveries/screenshot: the template's preview page as a PNG. */
export type DeliveryScreenshot = {
  role: CodegenRole;
  repo_full_name: string;
  base_branch: string;
  template: { repo: string; sha: string };
  /** Viewport in CSS pixels (the PNG is 2x). */
  width: number;
  height: number;
  png_base64: string;
};
