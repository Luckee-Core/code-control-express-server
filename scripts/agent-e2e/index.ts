/**
 * Agent pipeline E2E against local test doubles (no real GitHub or Anthropic):
 *   PR agent → convention agent → template agent → merge → convergence, plus revise, dismiss,
 *   manual-edit propagation and deny-with-revert.
 *
 * Usage: npx ts-node scripts/agent-e2e/index.ts --templates <dir with codegen template repos> \
 *          --template-repos <dir with template repo checkouts> --storage <code-generator-storage-server dir>
 * Creates and drops the Postgres database `cc_agent_e2e`.
 */
import { execSync, spawn, type ChildProcess } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { SAMPLE_DATA_MODELS } from '../../src/services/codegen/sample-data-model';
import { buildCodegenContext } from '../../src/services/codegen/engine/build-codegen-context';
import { loadTemplateSourceFromDirectory } from '../../src/services/codegen/engine/load-template-source';
import { renderWithTemplates } from '../../src/services/codegen/engine/render-with-templates';
import { MockGithub, startMockServer } from './mock-services';

const arg = (name: string): string => {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) throw new Error(`--${name} is required`);
  return process.argv[index + 1];
};
const TEMPLATES = arg('templates');
const TEMPLATE_REPOS = arg('template-repos');
const STORAGE_DIR = arg('storage');
const DB = 'cc_agent_e2e';
/** Leave the stack running after the checks (with runs in mixed states) for UI testing; Ctrl+C stops it. */
const KEEP_ALIVE = process.argv.includes('--keep-alive');
const MOCK_PORT = 3990;
const STORAGE_PORT = 3991;
const API_PORT = 3992;
const API = `http://127.0.0.1:${API_PORT}/api/data`;
const VALIDATION_GUARD = "    if (!req.body || typeof req.body !== 'object') {\n      res.status(400).json({ success: false, error: 'Body must be a JSON object' });\n      return;\n    }\n";
const PICK_LINE = '    const input = pickFields(req.body, ';
const NEW_KEY = 'api.svc.reject_non_object_body';

let passed = 0;
const check = (condition: unknown, message: string): void => {
  if (!condition) throw new Error(`FAILED: ${message}`);
  passed += 1;
  console.log(`  ✅ ${message}`);
};

const readTree = (dir: string, skip = ['node_modules', '.git', 'dist', '.next', 'codegen']): Record<string, string> => {
  const files: Record<string, string> = {};
  const walk = (current: string) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (skip.includes(entry.name)) continue;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (fs.statSync(full).size < 200_000) files[path.relative(dir, full).split(path.sep).join('/')] = fs.readFileSync(full, 'utf8');
    }
  };
  walk(dir);
  return files;
};

/** A generated file the PR agent deletes in its revision (the routes barrel still imports it). */
const PROCESS_FILE = 'src/services/notes/routes/delete-note-handler.ts';
const TEMPLATE_DELETE = '.cursor/architecture/009-stripe-checkout-one-time-payment.md';

const fenced = (user: string, file: string): string => {
  const start = user.indexOf(`### ${file}\n`);
  if (start === -1) throw new Error(`mock AI: ${file} not in prompt`);
  // The opening fence is the backtick run on the line after the heading; the block ends at the same run on its own line.
  const fenceStart = user.indexOf('\n', start) + 1;
  const fence = /^`+/.exec(user.slice(fenceStart))![0];
  const open = user.indexOf('\n', fenceStart) + 1;
  return user.slice(open, user.indexOf(`\n${fence}`, open - 1) + 1);
};

/** Scripted model answers per agent. */
const aiResponder = ({ system, user }: { system: string; user: string }): unknown => {
  if (system.startsWith('You are the PR agent')) {
    const file = 'src/services/notes/routes/post-note-handler.ts';
    const content = fenced(user, file);
    return {
      summary: 'Reject non-object JSON bodies with 400 before picking fields.',
      edits: [{ path: file, content: content.replace(PICK_LINE, `${VALIDATION_GUARD}${PICK_LINE}`), explanation: 'Validate the body shape (feedback).' }],
      // The revision also deletes a handler (the routes barrel still imports it, so the dangling-import check fires).
      deletes: user.includes('Earlier attempt') ? [{ path: PROCESS_FILE, explanation: 'Notes are never deleted.' }] : [],
      notes: user.includes('Earlier attempt') ? ['Revised after reviewer response'] : [],
    };
  }
  if (system.startsWith('You are the convention agent')) {
    const existing = /- `(api\.[a-z0-9_.]+)`/.exec(user)?.[1] ?? 'api.svc.unknown';
    return {
      summary: 'The feedback adds a body-shape rule for POST/PATCH handlers.',
      decision: 'changes',
      no_change_reason: '',
      changes: [
        {
          change_type: 'create', convention_key: NEW_KEY, verdict: 'new', cited_key: '', reason: 'Handlers trusted req.body shape.',
          domain_key: 'api_services', topic_key: 'api_services.services', title: 'Reject non-object bodies', statement: 'POST and PATCH handlers return 400 when the body is not a JSON object.',
          rationale: 'pickFields on a string silently returns {}.', severity: 'must', role_keys: ['express', 'storage', 'web'],
          example: { include: true, title: 'Guard before pickFields', kind: 'correct', language: 'ts', path_hint: 'src/services/{folder}/routes/post-*.ts', code: VALIDATION_GUARD, note: '' },
        },
        {
          change_type: 'refine', convention_key: existing, verdict: 'refines', cited_key: existing, reason: 'Mention validation order.',
          domain_key: 'api_services', topic_key: '', title: '', statement: 'Handlers validate input (including body shape) before calling process functions.', rationale: '', severity: '', role_keys: [],
          example: { include: false, title: '', kind: 'correct', language: 'ts', path_hint: '', code: '', note: '' },
        },
      ],
    };
  }
  if (system.startsWith('You are the template agent')) {
    // Three repos, three outcomes: express gets codegen + ADR, storage an ADR note, web needs nothing.
    const repo = /# Template repo: (\S+)/.exec(user)?.[1] ?? '';
    if (repo === 'tmpl/nextjs-template') return { decision: 'not_needed', not_needed_reason: 'Web has no request handlers', files_to_read: [] };
    if (user.includes('Pick up to')) {
      return { decision: 'continue', not_needed_reason: '', files_to_read: [{ path: '.cursor/architecture/002-router-factory-and-handler-pattern.md', why: 'ADR for handlers' }] };
    }
    const adrPath = '.cursor/architecture/002-router-factory-and-handler-pattern.md';
    const adr = fenced(user, adrPath);
    const edits: Array<{ path: string; content: string; explanation: string; convention_keys: string[] }> = [
      { path: adrPath, content: `${adr}\n- Reject non-object JSON bodies with 400 (\`${NEW_KEY}\`).\n`, explanation: 'Document the rule', convention_keys: [NEW_KEY] },
    ];
    const deletes = repo === 'tmpl/express-server-template' ? [{ path: TEMPLATE_DELETE, explanation: 'Retired ADR', convention_keys: [NEW_KEY] }] : [];
    if (repo === 'tmpl/express-server-template' && user.includes(NEW_KEY)) {
      const templatePath = 'codegen/crud/express/handler-post.ts.eta';
      edits.push({ path: templatePath, content: fenced(user, templatePath).replace(PICK_LINE, `${VALIDATION_GUARD}${PICK_LINE}`), explanation: 'Generate the guard', convention_keys: [NEW_KEY] });
    }
    return { summary: 'Templates follow the updated handler conventions.', decision: 'edits', not_needed_reason: '', edits, deletes };
  }
  throw new Error(`mock AI: unknown system prompt ${system.slice(0, 60)}`);
};

const request = async <T = any>(method: string, url: string, body?: unknown): Promise<{ status: number; data: T; error?: string }> => {
  const response = await fetch(`${API}${url}`, { method, headers: body ? { 'content-type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined });
  const json = (await response.json()) as { data: T; error?: string };
  return { status: response.status, data: json.data, error: json.error };
};

const waitForStatus = async (runId: string, statuses: string[], timeoutMs = 30_000): Promise<any> => {
  const started = Date.now();
  for (;;) {
    const { data } = await request('GET', `/agent-runs/${runId}`);
    if (statuses.includes(data.run.status)) return data;
    if (Date.now() - started > timeoutMs) throw new Error(`Run ${runId} stuck in ${data.run.status} (${data.run.error ?? ''})`);
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
};

const waitForHttp = async (url: string): Promise<void> => {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`${url} did not come up`);
};

const main = async (): Promise<void> => {
  const children: ChildProcess[] = [];
  const logDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-e2e-'));
  const sql = (statement: string): string => execSync(`psql -d ${DB} -Atqc ${JSON.stringify(statement)}`, { encoding: 'utf8' }).trim();
  try {
    execSync(`dropdb --if-exists ${DB} && createdb ${DB}`);
    execSync('npx ts-node scripts/apply-migrations.ts', { cwd: STORAGE_DIR, env: { ...process.env, DATABASE_URL: `postgresql:///${DB}` }, stdio: 'ignore' });

    // GitHub: three template repos (codegen + scaffold) and a project express repo with an open data-access PR.
    const github = new MockGithub();
    for (const repo of ['express-server-template', 'express-storage-server-template', 'nextjs-template']) {
      const codegen = Object.fromEntries(Object.entries(readTree(path.join(TEMPLATES, repo, 'codegen'), [])).map(([file, content]) => [`codegen/${file}`, content]));
      github.createRepo(`tmpl/${repo}`, { ...readTree(path.join(TEMPLATE_REPOS, repo)), ...codegen });
    }
    const fixture = SAMPLE_DATA_MODELS[1];
    const vocabulary = JSON.parse(sql("select json_build_object('column_types',(select json_agg(c) from column_types c where c.is_active),'standard_columns',(select json_agg(s) from standard_columns s),'lifecycle_options',(select json_agg(l) from lifecycle_options l))"));
    const source = loadTemplateSourceFromDirectory(path.join(TEMPLATES, 'express-server-template'));
    const scaffold = readTree(path.join(TEMPLATE_REPOS, 'express-server-template'));
    const render = (kind: 'model' | 'crud', files: Record<string, string>) => {
      const state = { paths: new Set(Object.keys(files)), files: { 'index.ts': files['index.ts'] ?? null, 'src/services/api-data/router.ts': files['src/services/api-data/router.ts'] ?? null, 'src/model/index.ts': files['src/model/index.ts'] ?? null } };
      const context = buildCodegenContext({ role: 'express', kind, content: fixture.content, vocabulary, version: fixture.version, state });
      return renderWithTemplates({ source, kind, role: 'express', context, state }).files;
    };
    const mainFiles = { ...scaffold, ...Object.fromEntries(render('model', scaffold).map((file) => [file.path, file.content])) };
    const mainSha = github.createRepo('acme/acme-express-server', mainFiles);
    const crud = render('crud', mainFiles);
    const prSha = github.commit('acme/acme-express-server', mainSha, Object.fromEntries(crud.map((file) => [file.path, file.content])), 'Data access v1');
    const project = github.repos.get('acme/acme-express-server')!;
    project.refs.set('code-control/data-access-v1', prSha);
    project.pulls.push({ number: 1, title: 'Data access v1', body: '', head: 'code-control/data-access-v1', base: 'main', state: 'open', merged: false, merge_commit_sha: null, comments: [] });

    const systemId = sql("insert into software_systems (customer_id, name) values (gen_random_uuid(), 'Acme Ops') returning id");
    const repoId = sql(`insert into software_system_repos (customer_id, software_system_id, repo_type, role, name, repo_url) values (gen_random_uuid(), '${systemId}', 'express', 'express', 'acme-express-server', 'https://github.com/acme/acme-express-server') returning id`);
    const proposalId = sql(`insert into data_model_proposals (software_system_id, version, status, context_text, proposal) values ('${systemId}', ${fixture.version}, 'approved', 'notes app', '${JSON.stringify(fixture.content).replace(/'/g, "''")}'::jsonb) returning id`);
    const files = JSON.stringify(crud.map((file) => ({ path: file.path, action: file.action })));
    const deliveryId = sql(`insert into data_model_deliveries (proposal_id, software_system_id, software_system_repo_id, kind, role, repo_full_name, branch, base_branch, pr_number, pr_url, commit_sha, status, files) values ('${proposalId}', '${systemId}', '${repoId}', 'crud', 'express', 'acme/acme-express-server', 'code-control/data-access-v1', 'main', 1, 'https://github.example/acme/acme-express-server/pull/1', '${prSha}', 'opened', '${files}'::jsonb) returning id`);

    const mock = await startMockServer(MOCK_PORT, github, aiResponder);
    const storageLog = fs.openSync(path.join(logDir, 'storage.log'), 'w');
    children.push(spawn('npx', ['ts-node', path.join(STORAGE_DIR, 'index.ts')], { cwd: logDir, env: { ...process.env, PORT: String(STORAGE_PORT), STORAGE_BIND_HOST: '127.0.0.1', DATABASE_URL: `postgresql:///${DB}`, STORAGE_DISPATCHER_SECRET: 'e2e' }, stdio: ['ignore', storageLog, storageLog] }));
    const apiLog = fs.openSync(path.join(logDir, 'api.log'), 'w');
    const blank = Object.fromEntries(['MAIN_GATEWAY_URL', 'MAIN_GATEWAY_PROJECT_ID', 'DISPATCHER_GATE_SECRET', 'GITHUB_TEMPLATE_PYTHON', 'GITHUB_TEMPLATE_REACT_NATIVE', 'GITHUB_OWNER', 'GITHUB_ALLOWED_OWNERS', 'CODEGEN_TEMPLATES_DIR'].map((key) => [key, '']));
    children.push(spawn('npx', ['ts-node', 'index.ts'], {
      cwd: path.resolve(__dirname, '../..'),
      env: {
        ...process.env, ...blank, PORT: String(API_PORT), CANONICAL_DATA_ACCESS_MODE: 'direct', CODE_CONTROL_DIRECT_URL: `http://127.0.0.1:${STORAGE_PORT}`, CODE_CONTROL_DIRECT_SECRET: 'e2e',
        ANTHROPIC_API_KEY: 'e2e', ANTHROPIC_BASE_URL: `http://127.0.0.1:${MOCK_PORT}`, GITHUB_API_URL: `http://127.0.0.1:${MOCK_PORT}`, GITHUB_PERSONAL_ACCESS_TOKEN: 'e2e',
        GITHUB_TEMPLATE_EXPRESS: 'tmpl/express-server-template', GITHUB_TEMPLATE_STORAGE_EXPRESS: 'tmpl/express-storage-server-template', GITHUB_TEMPLATE_WEB: 'tmpl/nextjs-template',
      },
      stdio: ['ignore', apiLog, apiLog],
    }));
    await waitForHttp(`http://127.0.0.1:${API_PORT}/api/health`);
    console.log(`Logs: ${logDir}`);

    console.log('\n① PR agent');
    const created = await request('POST', `/data-model-deliveries/${deliveryId}/pr-agent-runs`, { feedback: 'POST handlers accept a string body', focus_paths: ['src/services/notes/routes/post-note-handler.ts'] });
    check(created.status === 201 && created.data.status === 'draft', 'Update PR creates a draft (not started)');
    const patched = await request('PATCH', `/agent-runs/${created.data.id}`, { feedback: 'POST handlers must reject non-object bodies with 400' });
    check(patched.data.input.feedback.includes('non-object'), 'draft feedback is editable');
    check((await request('GET', '/agent-runs/summary')).data.pr.waiting === 1, 'sidebar summary counts the draft');
    await request('POST', `/agent-runs/${created.data.id}/confirm`, {});
    let pr = await waitForStatus(created.data.id, ['needs_review', 'failed']);
    check(pr.run.status === 'needs_review', `confirmed run built proposed edits (${pr.run.error ?? 'ok'})`);
    check(pr.pr.edits.length === 1 && pr.pr.edits[0].after_content.includes('Body must be a JSON object'), 'one edit with the guard');
    check(pr.exchanges.length === 1 && pr.run.input_tokens > 0, 'AI call recorded with tokens');
    check(!pr.run.findings.some((finding: any) => finding.severity === 'error'), 'no error findings on the edit');

    // Revise loop on the PR agent
    const revised = await request('POST', `/agent-runs/${created.data.id}/revise`, { feedback: 'Same, but keep the error message short', run_now: true });
    check(revised.data.version === 2, 'revise creates v2');
    pr = await waitForStatus(revised.data.id, ['needs_review', 'failed']);
    check(pr.versions.length === 2 && pr.versions[0].status === 'superseded', 'v1 superseded, versions listed');
    const deleteEdit = pr.pr.edits.find((edit: any) => edit.path === PROCESS_FILE);
    check(deleteEdit?.after_content === null && typeof deleteEdit?.before_content === 'string', 'v2 proposes deleting the process file (after_content null)');
    check(pr.run.findings.some((finding: any) => finding.convention_key === 'agent.dangling_import' && finding.path.endsWith('routes/index.ts')), 'dangling-import check flags the routes barrel that still imports it');
    const prRunId = revised.data.id;

    const approvedPr = await request('POST', `/agent-runs/${prRunId}/approve`, { note: 'looks right' });
    check(approvedPr.status === 200 && approvedPr.data.next[0].agent === 'convention' && approvedPr.data.next[0].status === 'draft', `approve commits and creates a convention draft (${approvedPr.error ?? ''})`);
    const branchContent = github.treeAt('acme/acme-express-server', 'code-control/data-access-v1')!.get('src/services/notes/routes/post-note-handler.ts')!;
    check(branchContent.includes(VALIDATION_GUARD), 'edit committed to the PR branch');
    check(!github.treeAt('acme/acme-express-server', 'code-control/data-access-v1')!.has(PROCESS_FILE), 'deleted file is gone from the PR branch');
    check(sql(`select count(*) from data_model_deliveries, jsonb_array_elements(files) f where id='${deliveryId}' and f->>'path'='${PROCESS_FILE}'`) === '0', 'delivery file list drops the deleted path');
    check(project.pulls[0].comments.length === 1, 'PR got a comment');
    check(sql(`select commit_sha from data_model_deliveries where id='${deliveryId}'`) === github.repos.get('acme/acme-express-server')!.refs.get('code-control/data-access-v1'), 'delivery commit_sha updated');

    console.log('\n② Convention agent');
    const conventionRunId = approvedPr.data.next[0].id;
    await request('POST', `/agent-runs/${conventionRunId}/confirm`, { instructions: 'Prefer refining over new rules' });
    let conv = await waitForStatus(conventionRunId, ['needs_review', 'failed', 'no_change']);
    check(conv.run.status === 'needs_review' && conv.convention.changes.length === 2, `two proposed changes (${conv.run.error ?? 'ok'})`);
    check(conv.convention.changes.every((change: any) => change.status === 'proposed'), 'ledger rows are proposed, nothing applied yet');
    check(conv.convention.related.length >= 1, 'cited conventions included for side-by-side');
    const create = conv.convention.changes.find((change: any) => change.change_type === 'create');
    const refine = conv.convention.changes.find((change: any) => change.change_type === 'refine');
    const badApprove = await request('POST', `/agent-runs/${conventionRunId}/approve`, { decisions: [{ change_id: create.id, action: 'accept' }] });
    check(badApprove.status === 400, 'approve requires a decision for every proposal');
    const approvedConv = await request('POST', `/agent-runs/${conventionRunId}/approve`, {
      note: 'ok',
      decisions: [
        { change_id: create.id, action: 'accept', after: { ...create.after, title: 'Reject non-object JSON bodies' } },
        { change_id: refine.id, action: 'reject' },
      ],
    });
    check(approvedConv.status === 200, `decisions applied (${approvedConv.error ?? ''})`);
    check(sql(`select title from conventions where key='${NEW_KEY}'`) === 'Reject non-object JSON bodies', 'accepted create applied with the reviewer edit');
    check(sql(`select string_agg(change_type||':'||status, ',' order by change_type) from convention_changes where source_id='${conventionRunId}'`) === 'create:applied,example_add:applied,refine:rejected', 'ledger: create + its example applied, refine rejected');
    check(sql(`select count(*) from convention_changes where source_type='convention_agent' and change_type='example_add' and source_id='${conventionRunId}'`) === '1', 'example recorded as its own ledger row');
    const templateDraft = approvedConv.data.next[0];
    check(templateDraft?.agent === 'template' && templateDraft.status === 'draft' && approvedConv.data.next.length === 1, 'exactly one template draft created (covers every repo)');
    conv = (await request('GET', `/agent-runs/${conventionRunId}`)).data;
    check(conv.children.some((child: any) => child.id === templateDraft.id), 'convention run lists the template draft as a hand-off');

    console.log('\n③ Template agent');
    let tmpl = (await request('GET', `/agent-runs/${templateDraft.id}`)).data;
    check(tmpl.template.propagations.length === 6 && tmpl.template.propagations.every((row: any) => row.status === 'pending'), 'draft collects the create + example changes for 3 repos');
    check(JSON.stringify(tmpl.template.repos) === JSON.stringify(['tmpl/express-server-template', 'tmpl/express-storage-server-template', 'tmpl/nextjs-template']), 'draft lists the three template repos');
    await request('POST', `/agent-runs/${templateDraft.id}/confirm`, {});
    tmpl = await waitForStatus(templateDraft.id, ['needs_review', 'failed', 'no_change']);
    check(tmpl.run.status === 'needs_review', `template PR built (${tmpl.run.error ?? 'ok'})`);
    check(!tmpl.run.findings.some((finding: any) => finding.severity === 'error'), `sample render passes checks (${JSON.stringify(tmpl.run.findings.filter((finding: any) => finding.severity === 'error')).slice(0, 300)})`);
    const statusOf = (repo: string) => [...new Set(tmpl.template.propagations.filter((row: any) => row.template_repo === repo).map((row: any) => row.status))].join(',');
    check(
      tmpl.template.template_changes.length === 2 && tmpl.template.template_changes.every((change: any) => change.pr_number === 1),
      'one confirm opened a PR in express and storage',
    );
    check(statusOf('tmpl/express-server-template') === 'in_run' && statusOf('tmpl/express-storage-server-template') === 'in_run' && statusOf('tmpl/nextjs-template') === 'not_needed', 'propagations: in_run ×2, web not_needed');
    check(tmpl.run.output.repos['tmpl/nextjs-template']?.status === 'not_needed' && tmpl.run.summary.includes('nextjs-template: no change'), 'web outcome recorded as no change');
    check(tmpl.exchanges.length === 5, 'AI passes recorded per repo (2 + 2 + 1)');
    const repoQuery = `repo=${encodeURIComponent('tmpl/express-server-template')}`;
    const storageDiff = await request('GET', `/agent-runs/${templateDraft.id}/template-diff?repo=${encodeURIComponent('tmpl/express-storage-server-template')}`);
    check(storageDiff.data.length === 1 && storageDiff.data[0].area === 'adr', 'storage PR diff: ADR only');
    const listed = (await request('GET', '/agent-runs?agent=template')).data.find((run: any) => run.id === templateDraft.id);
    check(listed.template_changes.length === 2, 'runs table row lists both template PRs');
    const diff = await request('GET', `/agent-runs/${templateDraft.id}/template-diff?${repoQuery}`);
    check(diff.data.length === 3 && diff.data.some((file: any) => file.area === 'codegen') && diff.data.some((file: any) => file.area === 'adr'), 'template diff: codegen + ADR + deleted ADR');
    check(diff.data.find((file: any) => file.filename === TEMPLATE_DELETE)?.status === 'removed', 'template diff shows the deleted file as removed');
    check(tmpl.template.template_changes.flatMap((change: any) => change.files).some((file: any) => file.path === TEMPLATE_DELETE && file.action === 'delete'), 'template change records the delete');
    const adrPatch: string = diff.data.find((file: any) => file.filename === '.cursor/architecture/002-router-factory-and-handler-pattern.md')?.patch ?? '';
    check(adrPatch.includes('+- Reject non-object') && !adrPatch.split('\n').some((line) => line.startsWith('-')), 'ADR with ``` blocks round-trips intact (pure addition)');
    const preview = await request('GET', `/agent-runs/${templateDraft.id}/render-preview?${repoQuery}`);
    check(preview.data.files.length === 1 && preview.data.files[0].after.includes(VALIDATION_GUARD), 'render preview shows the generated handler change');
    const file = await request('GET', `/agent-runs/${templateDraft.id}/template-file?${repoQuery}&path=codegen/crud/express/handler-post.ts.eta&at=head`);
    check(file.data.content.includes('Body must be a JSON object'), 'file content at head');
    const approvedTmpl = await request('POST', `/agent-runs/${templateDraft.id}/approve`, { note: 'merge' });
    check(approvedTmpl.status === 200 && approvedTmpl.data.run.status === 'approved', `template PR merged (${approvedTmpl.error ?? ''})`);
    check(github.treeAt('tmpl/express-server-template', 'main')!.get('codegen/crud/express/handler-post.ts.eta')!.includes('Body must be a JSON object'), 'template main has the new template');
    check(!github.treeAt('tmpl/express-server-template', 'main')!.has(TEMPLATE_DELETE), 'deleted template file gone from main after merge');
    // The templates now generate the guard, but still generate the handler the PR deleted.
    check(
      sql(`select convergence || ':' || (convergence_detail->'differing_paths')::text from data_model_deliveries where id='${deliveryId}'`) === `diverged:["${PROCESS_FILE}"]`,
      'convergence: guard reproduced; the PR-deleted handler is the only difference',
    );
    check(github.repos.get('tmpl/express-storage-server-template')!.pulls[0].merged, 'storage template PR merged too');
    check(sql(`select string_agg(distinct status, ',' order by status) from convention_change_propagations where run_id='${templateDraft.id}'`) === 'merged,not_needed', 'propagations merged (web not_needed)');
    const lineage = (await request('GET', `/agent-runs/${templateDraft.id}`)).data.lineage.map((run: any) => `${run.agent}:${run.status}`);
    check(JSON.stringify(lineage) === JSON.stringify(['pr:superseded', 'pr:approved', 'convention:approved', 'template:approved']), `lineage ${lineage.join(' → ')}`);
    const heads = await request('GET', '/agent-runs/template-heads');
    check(heads.data.find((head: any) => head.role_key === 'express')?.sha === github.repos.get('tmpl/express-server-template')!.refs.get('main'), 'template heads endpoint');

    console.log('\n④ Manual edit → template draft, dismiss, deny with revert');
    const conventionId = sql(`select id from conventions where key='${NEW_KEY}'`);
    const edit = await request('PATCH', `/conventions/${conventionId}`, { severity: 'should', change_reason: 'too strict for internal APIs' });
    check(edit.status === 200, 'manual convention edit');
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const drafts = (await request('GET', '/agent-runs?agent=template&status=draft')).data;
    check(drafts.length === 1 && drafts[0].parent_run_id === null, 'manual edit swept into a new template draft (no parent)');
    const dismissed = await request('POST', `/agent-runs/${drafts[0].id}/dismiss`, { note: 'not now' });
    check(dismissed.data.status === 'dismissed' && sql(`select string_agg(distinct status, ',') || ':' || count(*) from convention_change_propagations where run_id='${drafts[0].id}'`) === 'skipped:3', 'dismiss marks the change skipped in all 3 repos');

    await request('PATCH', `/conventions/${conventionId}`, { severity: 'avoid', change_reason: 'try again' });
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const [draft2] = (await request('GET', '/agent-runs?agent=template&status=draft')).data;
    await request('POST', `/agent-runs/${draft2.id}/confirm`, {});
    const built2 = await waitForStatus(draft2.id, ['needs_review', 'failed', 'no_change']);
    check(built2.run.status === 'needs_review', `second template run built (${built2.run.error ?? 'ok'})`);
    const denied = await request('POST', `/agent-runs/${draft2.id}/reject`, { note: 'keep must', revert_changes: true });
    check(denied.status === 200 && denied.data.reverted === 1, `deny reverts the carried change (${denied.error ?? JSON.stringify(denied.data?.notes)})`);
    check(sql(`select severity from conventions where id='${conventionId}'`) === 'should', 'severity reverted to before the denied change');
    const prState = github.repos.get('tmpl/express-server-template')!.pulls.find((item) => item.number === 2);
    check(prState?.state === 'closed' && !prState.merged, 'template PR closed, not merged');
    const storagePr = github.repos.get('tmpl/express-storage-server-template')!.pulls.find((item) => item.number === 2);
    check(storagePr?.state === 'closed' && !storagePr.merged, 'deny closes the PR in every repo');
    check(sql(`select count(*) from convention_changes where source_type='template_agent' and source_id='${draft2.id}'`) === '1', 'revert recorded in the ledger');
    await new Promise((resolve) => setTimeout(resolve, 3000));
    check((await request('GET', '/agent-runs?agent=template&status=draft')).data.length === 0, 'revert is not propagated again');

    console.log('\n⑤ Guards');
    const confirmAgain = await request('POST', `/agent-runs/${draft2.id}/confirm`, {});
    check(confirmAgain.status === 409, 'actions are refused in the wrong status');
    const missing = await request('GET', '/agent-runs/00000000-0000-0000-0000-000000000000');
    check(missing.status === 404, 'unknown run 404');
    const otherChain = await request('POST', `/data-model-deliveries/${deliveryId}/pr-agent-runs`, { feedback: 'unrelated draft' });
    const firstChain = (await request('GET', `/agent-runs/${templateDraft.id}`)).data.lineage.map((run: any) => run.id);
    check(!firstChain.includes(otherChain.data.id) && firstChain.length === 4, 'lineage only includes runs from its own chain');
    await request('POST', `/agent-runs/${otherChain.data.id}/dismiss`, {});
    const exchange = await request('GET', `/agent-runs/${prRunId}/exchanges/${pr.exchanges[0].id}`);
    check(exchange.data.system_prompt.startsWith('You are the PR agent'), 'exchange bodies readable');

    console.log(`\n✅ ${passed} checks passed`);
    if (KEEP_ALIVE) {
      // A second chain left waiting on review, plus a PR draft, so every page has something to show.
      const second = await request('POST', `/data-model-deliveries/${deliveryId}/pr-agent-runs`, { feedback: 'POST handlers must reject non-object bodies (second pass)', run_now: true });
      await waitForStatus(second.data.id, ['needs_review']);
      const handOff = await request('POST', `/agent-runs/${second.data.id}/approve`, { note: 'ok' });
      await request('POST', `/agent-runs/${handOff.data.next[0].id}/confirm`, {});
      await waitForStatus(handOff.data.next[0].id, ['needs_review', 'no_change', 'failed']);
      await request('POST', `/data-model-deliveries/${deliveryId}/pr-agent-runs`, { feedback: 'Use 422 for validation errors', focus_paths: ['src/services/notes/routes/patch-note-handler.ts'] });
      console.log(`READY api=http://127.0.0.1:${API_PORT} software_system=${systemId}`);
      await new Promise<void>((resolve) => {
        process.on('SIGINT', resolve);
        process.on('SIGTERM', resolve);
      });
    }
    mock.close();
  } finally {
    for (const child of children) child.kill('SIGTERM');
    await new Promise((resolve) => setTimeout(resolve, 500));
    try {
      execSync(`dropdb --if-exists ${DB}`, { stdio: 'ignore' });
    } catch {
      /* best effort */
    }
  }
};

main().catch((error) => {
  console.error(`\n❌ ${error instanceof Error ? error.message : error}`);
  process.exit(1);
});
