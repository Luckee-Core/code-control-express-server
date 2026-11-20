import fs from 'fs';
import path from 'path';
import type { GithubRepoRef } from '../../github';
import { getFileText, listTreePaths } from '../../github';
import { CodegenTemplateError } from './render-with-templates';
import type { CodegenManifest, TemplateSource } from './types';

const CODEGEN_DIR = 'codegen/';
const MANIFEST = 'manifest.json';

/** Template sets are immutable per commit, so they are cached by repo@sha for the process lifetime. */
const cache = new Map<string, Promise<TemplateSource>>();

const parseManifest = (repo: string, text: string): CodegenManifest => {
  let manifest: CodegenManifest;
  try {
    manifest = JSON.parse(text) as CodegenManifest;
  } catch (error) {
    throw new CodegenTemplateError(`${repo} codegen/manifest.json is not valid JSON: ${error instanceof Error ? error.message : error}`);
  }
  if (manifest.version !== 1 || !manifest.kinds || typeof manifest.kinds !== 'object') {
    throw new CodegenTemplateError(`${repo} codegen/manifest.json must have version 1 and a "kinds" object`);
  }
  return manifest;
};

/** Every file under codegen/ in a GitHub repo at one commit. */
const loadFromGithub = async (ref: GithubRepoRef, sha: string): Promise<TemplateSource> => {
  const repo = `${ref.owner}/${ref.repo}`;
  const paths = [...(await listTreePaths(ref, sha))].filter((item) => item.startsWith(CODEGEN_DIR));
  if (!paths.includes(`${CODEGEN_DIR}${MANIFEST}`)) {
    throw new CodegenTemplateError(`${repo}@${sha.slice(0, 7)} has no codegen/manifest.json. Merge its codegen templates first.`);
  }
  const contents = await Promise.all(paths.map((item) => getFileText(ref, item, sha)));
  const files = new Map<string, string>();
  paths.forEach((item, index) => files.set(item.slice(CODEGEN_DIR.length), contents[index] ?? ''));
  return { repo, sha, manifest: parseManifest(repo, files.get(MANIFEST) ?? ''), files };
};

/** Every file under <dir>/codegen (local checkouts: parity checks, tests, CODEGEN_TEMPLATES_DIR). */
export const loadTemplateSourceFromDirectory = (dir: string): TemplateSource => {
  const root = path.join(dir, 'codegen');
  const files = new Map<string, string>();
  const walk = (current: string): void => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else files.set(path.relative(root, full).split(path.sep).join('/'), fs.readFileSync(full, 'utf8'));
    }
  };
  if (!fs.existsSync(path.join(root, MANIFEST))) {
    throw new CodegenTemplateError(`${dir} has no codegen/manifest.json`);
  }
  walk(root);
  const repo = `local:${dir}`;
  return { repo, sha: 'local', manifest: parseManifest(repo, files.get(MANIFEST) ?? ''), files };
};

/**
 * Loads a template repo's codegen/ at a commit (cached). When CODEGEN_TEMPLATES_DIR is set, the
 * repo is read from `<dir>/<repo name>` on disk instead (local development).
 */
export const loadTemplateSource = async (ref: GithubRepoRef, sha: string): Promise<TemplateSource> => {
  const localRoot = process.env.CODEGEN_TEMPLATES_DIR?.trim();
  if (localRoot) {
    return loadTemplateSourceFromDirectory(path.join(localRoot, ref.repo));
  }
  const key = `${ref.owner}/${ref.repo}@${sha}`;
  let pending = cache.get(key);
  if (!pending) {
    pending = loadFromGithub(ref, sha);
    cache.set(key, pending);
    pending.catch(() => cache.delete(key));
  }
  return pending;
};
