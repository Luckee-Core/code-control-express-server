import type { CodegenRole } from '../codegen';
import type { RenderForRepoResult } from '../codegen';
import { commitFileToSideBranch, type GithubRepoRef } from '../github';
import { screenshotHtml } from '../screenshots';

/** Side branch holding preview images that delivery PR bodies link to (never merged). */
export const PREVIEWS_BRANCH = 'code-control-previews';

/** PNG of a rendered kind's preview page, or null when the template declares no preview. */
export const screenshotPreview = async (preview: RenderForRepoResult['preview']): Promise<Buffer | null> =>
  preview ? screenshotHtml(preview.html, { width: preview.width, height: preview.height }) : null;

/**
 * Screenshots the preview page and commits it to the repo's `code-control-previews` branch.
 * Best effort: returns null (and logs) when there is no preview or anything fails, so a missing
 * browser never blocks a delivery.
 */
export const publishPreviewImage = async (input: {
  ref: GithubRepoRef;
  preview: RenderForRepoResult['preview'];
  role: CodegenRole;
  /** File name stem, e.g. `layout-v1`; the commit sha is appended so each render gets its own URL. */
  name: string;
  commitSha: string;
}): Promise<string | null> => {
  if (!input.preview) return null;
  try {
    const png = await screenshotPreview(input.preview);
    if (!png) return null;
    return await commitFileToSideBranch({
      ref: input.ref,
      branch: PREVIEWS_BRANCH,
      path: `${input.role}/${input.name}-${input.commitSha.slice(0, 7)}.png`,
      base64: png.toString('base64'),
      message: `Preview for ${input.name} (${input.commitSha.slice(0, 7)})`,
    });
  } catch (error) {
    console.warn('⚠️ [data-model-deliveries] Preview image skipped', { error: error instanceof Error ? error.message : String(error) });
    return null;
  }
};
