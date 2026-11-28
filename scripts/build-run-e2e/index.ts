/**
 * Build all E2E against the in-memory GitHub (no real GitHub): checks before start, a run through
 * every tab, a pause on a PR that will not merge, continue, re-running a built version, and cancel.
 *
 * Usage: npx ts-node scripts/build-run-e2e/index.ts --templates <dir with codegen template repos> \
 *          --template-repos <dir with template repo checkouts> --storage <code-generator-storage-server dir>
 * Add --keep-alive to leave the stack running for UI testing, with a "Demo Notes" project whose
 * approved data model is ready for Build all; GitHub then answers slowly (--slow-ms, default 300)
 * so the In progress view shows each phase. Creates and drops the Postgres database `cc_build_e2e`.
 */
import { execSync, spawn, type ChildProcess } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { SAMPLE_DATA_MODELS } from '../../src/services/codegen/sample-data-model';
import { MockGithub, startMockServer } from '../agent-e2e/mock-services';

const arg = (name: string): string => {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) throw new Error(`--${name} is required`);
  return process.argv[index + 1];
};
const TEMPLATES = arg('templates');
const TEMPLATE_REPOS = arg('template-repos');
const STORAGE_DIR = arg('storage');
const DB = 'cc_build_e2e';
const MOCK_PORT = 3993;
const STORAGE_PORT = 3994;
const API_PORT = 3995;
const API = `http://127.0.0.1:${API_PORT}/api/data`;
/** Leave the stack running after the checks (one completed and one paused run) for UI testing; Ctrl+C stops it. */
const KEEP_ALIVE = process.argv.includes('--keep-alive');
const SLOW_MS = process.argv.includes('--slow-ms') ? Number(arg('slow-ms')) : 300;
/** GitHub answers instantly during the checks, slowly once the stack is kept alive for the UI. */
let githubDelayMs = 0;

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

const request = async <T = any>(method: string, url: string, body?: unknown): Promise<{ status: number; data: T; error?: string }> => {
  const response = await fetch(`${API}${url}`, { method, headers: body ? { 'content-type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined });
  const json = (await response.json()) as { data: T; error?: string };
  return { status: response.status, data: json.data, error: json.error };
};

/** Polls a build run until its status is one of `statuses`. */
const waitForRun = async (runId: string, statuses: string[], timeoutMs = 180_000): Promise<any> => {
  const started = Date.now();
  for (;;) {
    const { data } = await request('GET', `/system-build-runs/${runId}`);
    if (statuses.includes(data.run.status)) return data;
    if (Date.now() - started > timeoutMs) throw new Error(`Run ${runId} stuck in ${data.run.status} at ${data.run.current_kind} (${data.run.error ?? ''})`);
    await new Promise((resolve) => setTimeout(resolve, 500));
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

const stepSummary = (detail: any): string => detail.steps.map((step: any) => `${step.kind}:${step.status}`).join(' ');

const main = async (): Promise<void> => {
  const children: ChildProcess[] = [];
  const logDir = fs.mkdtempSync(path.join(os.tmpdir(), 'build-run-e2e-'));
  const sql = (statement: string): string => execSync(`psql -d ${DB} -Atqc ${JSON.stringify(statement)}`, { encoding: 'utf8' }).trim();
  try {
    execSync(`dropdb --if-exists ${DB} && createdb ${DB}`);
    execSync('npx ts-node scripts/apply-migrations.ts', { cwd: STORAGE_DIR, env: { ...process.env, DATABASE_URL: `postgresql:///${DB}` }, stdio: 'ignore' });

    // GitHub: the three template repos (codegen + scaffold) and three project repos made from their scaffolds.
    const github = new MockGithub();
    const TEMPLATE_FOR = { storage: 'express-storage-server-template', express: 'express-server-template', web: 'nextjs-template' } as const;
    for (const repo of Object.values(TEMPLATE_FOR)) {
      const codegen = Object.fromEntries(Object.entries(readTree(path.join(TEMPLATES, repo, 'codegen'), [])).map(([file, content]) => [`codegen/${file}`, content]));
      github.createRepo(`tmpl/${repo}`, { ...readTree(path.join(TEMPLATE_REPOS, repo)), ...codegen });
    }
    const PROJECT = { storage: 'acme-storage-express-server', express: 'acme-express-server', web: 'acme-web' } as const;
    for (const [role, name] of Object.entries(PROJECT)) {
      github.createRepo(`acme/${name}`, readTree(path.join(TEMPLATE_REPOS, TEMPLATE_FOR[role as keyof typeof TEMPLATE_FOR])));
    }

    const fixture = SAMPLE_DATA_MODELS[1];
    const systemId = sql("insert into software_systems (customer_id, name) values (gen_random_uuid(), 'Acme Ops') returning id");
    const REPO_TYPE = { storage: 'storage-express', express: 'express', web: 'nextjs' } as const;
    for (const [role, name] of Object.entries(PROJECT)) {
      sql(`insert into software_system_repos (customer_id, software_system_id, repo_type, role, name, repo_url) values (gen_random_uuid(), '${systemId}', '${REPO_TYPE[role as keyof typeof REPO_TYPE]}', '${role}', '${name}', 'https://github.com/acme/${name}')`);
    }
    const proposalSql = (system: string, status: string, version = fixture.version) =>
      `insert into data_model_proposals (software_system_id, version, status, context_text, proposal) values ('${system}', ${version}, '${status}', 'notes app', '${JSON.stringify(fixture.content).replace(/'/g, "''")}'::jsonb) returning id`;
    const draftId = sql(proposalSql(systemId, 'ready', fixture.version + 1));
    const proposalId = sql(proposalSql(systemId, 'approved'));

    await startMockServer(
      MOCK_PORT,
      github,
      () => {
        throw new Error('Build all makes no AI calls');
      },
      { githubDelayMs: () => githubDelayMs },
    );
    const storageLog = fs.openSync(path.join(logDir, 'storage.log'), 'w');
    children.push(spawn('npx', ['ts-node', path.join(STORAGE_DIR, 'index.ts')], { cwd: logDir, env: { ...process.env, PORT: String(STORAGE_PORT), STORAGE_BIND_HOST: '127.0.0.1', DATABASE_URL: `postgresql:///${DB}`, STORAGE_DISPATCHER_SECRET: 'e2e' }, stdio: ['ignore', storageLog, storageLog] }));
    const apiLog = fs.openSync(path.join(logDir, 'api.log'), 'w');
    const blank = Object.fromEntries(['MAIN_GATEWAY_URL', 'MAIN_GATEWAY_PROJECT_ID', 'DISPATCHER_GATE_SECRET', 'MAIN_GATEWAY_REPO', 'GITHUB_TEMPLATE_PYTHON', 'GITHUB_TEMPLATE_REACT_NATIVE', 'GITHUB_OWNER', 'GITHUB_ALLOWED_OWNERS', 'CODEGEN_TEMPLATES_DIR'].map((key) => [key, '']));
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

    console.log('\n① Checks before anything is delivered');
    check((await request('POST', '/system-build-runs', {})).status === 400, 'proposal_id is required');
    const notApproved = await request('POST', '/system-build-runs', { proposal_id: draftId });
    check(notApproved.status === 409 && /Approve/.test(notApproved.error ?? ''), 'an unapproved version is refused');
    const noDispatcher = await request('POST', '/system-build-runs', { proposal_id: proposalId });
    check(noDispatcher.status === 409 && (noDispatcher.error ?? '').startsWith('Dispatcher tab:'), `a project type with a dispatcher but no dispatcher repos is refused up front (${noDispatcher.error})`);
    check(sql(`select count(*) from system_build_runs`) === '0', 'no run row was created');
    sql(`update software_systems set setup_preset_key = 'supabase_customer' where id = '${systemId}'`);

    console.log('\n② Build all, pausing on a PR that will not merge');
    github.blockedMerges.add('acme/acme-web');
    const created = await request('POST', '/system-build-runs', { proposal_id: proposalId });
    check(created.status === 202 && created.data.run.status === 'running', `run starts in the background (${created.error ?? ''})`);
    check(created.data.steps.length === 7 && created.data.steps.map((step: any) => step.kind).join(',') === 'model,crud,layout,list,detail,dashboard,dispatcher', 'seven steps in tab order');
    const dispatcherStep = created.data.steps.find((step: any) => step.kind === 'dispatcher');
    check(dispatcherStep.status === 'skipped' && /no dispatcher/.test(dispatcherStep.note), 'dispatcher skipped for a project type without one');
    const runId = created.data.run.id;
    check((await request('POST', '/system-build-runs', { proposal_id: proposalId })).status === 409, 'a second run for the same project is refused');
    let detail = await waitForRun(runId, ['paused', 'failed', 'completed']);
    check(detail.run.status === 'paused' && detail.run.current_kind === 'model', `paused on the data model step (${stepSummary(detail)} ${detail.run.error ?? ''})`);
    const modelStep = detail.steps.find((step: any) => step.kind === 'model');
    check(modelStep.status === 'waiting_merge' && modelStep.note.includes('acme-web') && modelStep.delivery_ids.length === 3, 'model step waits on the web PR and records its three deliveries');
    const modelPhases = (modelStep.progress?.repos ?? []).map((repo: any) => `${repo.role}:${repo.phase}`).join(' ');
    check(modelPhases === 'storage:merged express:merged web:open', `step progress shows each repo's phase (${modelPhases})`);
    const webProgress = modelStep.progress.repos.find((repo: any) => repo.role === 'web');
    check(webProgress.pr_number && webProgress.pr_url && webProgress.files > 0 && webProgress.error, 'open repo keeps its PR, file count and the merge error');
    check(github.repos.get('acme/acme-storage-express-server')!.pulls[0]?.merged && github.repos.get('acme/acme-express-server')!.pulls[0]?.merged, 'storage and express PRs were squash-merged');
    check(github.repos.get('acme/acme-web')!.pulls[0]?.state === 'open', 'web PR left open');
    check(detail.events.some((event: any) => event.event_type === 'step_waiting' && event.detail?.pr_urls?.length === 3), 'log records the wait with the PR links');

    console.log('\n③ Continue after the merge is possible');
    github.blockedMerges.delete('acme/acme-web');
    const continued = await request('POST', `/system-build-runs/${runId}/continue`);
    check(continued.status === 202 && continued.data.run.status === 'running', `continue restarts the run (${continued.error ?? ''})`);
    detail = await waitForRun(runId, ['paused', 'failed', 'completed']);
    check(detail.run.status === 'completed', `run completes (${stepSummary(detail)} ${detail.run.error ?? ''})`);
    check(stepSummary(detail) === 'model:merged crud:merged layout:merged list:merged detail:merged dashboard:merged dispatcher:skipped', 'every step merged, dispatcher skipped');
    const notMerged = detail.steps
      .filter((step: any) => step.status === 'merged')
      .flatMap((step: any) => (step.progress?.repos ?? []).filter((repo: any) => repo.phase !== 'merged').map((repo: any) => `${step.kind}/${repo.role}:${repo.phase}`));
    check(notMerged.length === 0 && detail.steps.filter((step: any) => step.status === 'merged').every((step: any) => step.progress?.repos?.length > 0), `every merged step's repos end merged (${notMerged.join(' ')})`);
    check(detail.run.finished_at && detail.run.current_kind === null, 'run finished, no current step');
    check(github.repos.get('acme/acme-web')!.pulls[0].merged, 'the open web PR was merged on continue (not reopened)');
    const deliveries = sql(`select string_agg(kind || ':' || role || ':' || status, ' ' order by kind, role) from data_model_deliveries where proposal_id = '${proposalId}'`);
    check(!deliveries.includes(':opened') && !deliveries.includes(':failed'), `all deliveries merged (${deliveries})`);
    const webPaths = [...github.treeAt('acme/acme-web', 'main')!.keys()];
    check(webPaths.some((file) => file.startsWith('src/packages/')) && webPaths.some((file) => file.startsWith('src/model/')), 'web main has models and generated pages');
    check(github.treeAt('acme/acme-storage-express-server', 'main')!.size > Object.keys(readTree(path.join(TEMPLATE_REPOS, TEMPLATE_FOR.storage))).length, 'storage main grew (migration + data layer)');
    const types = detail.events.map((event: any) => event.event_type);
    check(types[0] === 'run_started' && types.includes('continued') && types[types.length - 1] === 'run_completed', 'log: started → … → continued → … → completed');
    check((await request('POST', `/system-build-runs/${runId}/cancel`)).status === 409, 'a completed run cannot be cancelled');
    check((await request('POST', `/system-build-runs/${runId}/continue`)).status === 409, 'a completed run cannot be continued');

    console.log('\n④ Building an already built version again');
    const pullsBefore = Object.values(PROJECT).map((name) => github.repos.get(`acme/${name}`)!.pulls.length).join(',');
    const again = await request('POST', '/system-build-runs', { proposal_id: proposalId });
    check(again.status === 202, 'a new run can start once the last one completed');
    detail = await waitForRun(again.data.run.id, ['paused', 'failed', 'completed']);
    check(detail.run.status === 'completed', `second run completes (${stepSummary(detail)} ${detail.run.error ?? ''})`);
    const pullsAfter = Object.values(PROJECT).map((name) => github.repos.get(`acme/${name}`)!.pulls.length).join(',');
    check(pullsBefore === pullsAfter, `no new PRs: merged repos are skipped (${pullsBefore} → ${pullsAfter})`);
    const secondPhases = new Set(detail.steps.flatMap((step: any) => (step.progress?.repos ?? []).map((repo: any) => repo.phase)));
    check([...secondPhases].every((phase) => phase === 'unchanged'), `second run reports repos as already merged (${[...secondPhases].join(',')})`);
    const listed = await request('GET', `/system-build-runs?software_system_id=${systemId}`);
    check(listed.data.length === 2 && listed.data[0].id === again.data.run.id, 'list returns both runs, newest first');

    console.log('\n⑤ Cancel a paused run');
    const otherSystem = sql("insert into software_systems (customer_id, name, setup_preset_key) values (gen_random_uuid(), 'Beta', 'supabase_customer') returning id");
    github.createRepo('acme/beta-storage-express-server', readTree(path.join(TEMPLATE_REPOS, TEMPLATE_FOR.storage)));
    sql(`insert into software_system_repos (customer_id, software_system_id, repo_type, role, name, repo_url) values (gen_random_uuid(), '${otherSystem}', 'storage-express', 'storage', 'beta-storage-express-server', 'https://github.com/acme/beta-storage-express-server')`);
    const betaProposal = sql(proposalSql(otherSystem, 'approved'));
    github.blockedMerges.add('acme/beta-storage-express-server');
    const beta = await request('POST', '/system-build-runs', { proposal_id: betaProposal });
    check(beta.data.steps.filter((step: any) => step.status === 'skipped').map((step: any) => step.kind).join(',') === 'layout,list,detail,dashboard,dispatcher', 'storage-only project: web-only tabs and dispatcher skipped');
    detail = await waitForRun(beta.data.run.id, ['paused', 'failed', 'completed']);
    check(detail.run.status === 'paused', `beta run paused on the blocked merge (${stepSummary(detail)})`);
    const cancelled = await request('POST', `/system-build-runs/${beta.data.run.id}/cancel`);
    check(cancelled.status === 200 && cancelled.data.run.status === 'cancelled' && cancelled.data.run.finished_at, 'paused run cancelled');
    check((await request('POST', `/system-build-runs/${beta.data.run.id}/continue`)).status === 409, 'a cancelled run cannot be continued');
    check(github.repos.get('acme/beta-storage-express-server')!.pulls[0].state === 'open', 'cancel leaves the open PR alone');
    check((await request('GET', '/system-build-runs/00000000-0000-0000-0000-000000000000')).status === 404, 'unknown run → 404');

    console.log(`\n✅ ${passed} checks passed`);
    if (KEEP_ALIVE) {
      const paused = await request('POST', '/system-build-runs', { proposal_id: betaProposal });
      await waitForRun(paused.data.run.id, ['paused', 'failed', 'completed']);
      const demoId = sql("insert into software_systems (customer_id, name, setup_preset_key) values (gen_random_uuid(), 'Demo Notes', 'supabase_customer') returning id");
      for (const [role, name] of Object.entries(PROJECT)) {
        const demoName = name.replace(/^acme-/, 'demo-notes-');
        github.createRepo(`acme/${demoName}`, readTree(path.join(TEMPLATE_REPOS, TEMPLATE_FOR[role as keyof typeof TEMPLATE_FOR])));
        sql(`insert into software_system_repos (customer_id, software_system_id, repo_type, role, name, repo_url) values (gen_random_uuid(), '${demoId}', '${REPO_TYPE[role as keyof typeof REPO_TYPE]}', '${role}', '${demoName}', 'https://github.com/acme/${demoName}')`);
      }
      sql(proposalSql(demoId, 'approved'));
      githubDelayMs = SLOW_MS;
      console.log(`\nStack kept alive: API ${API} (Acme Ops: completed run; Beta: paused run; Demo Notes: press Build all, GitHub answers in ${SLOW_MS} ms). Ctrl+C to stop.`);
      await new Promise<void>((resolve) => process.once('SIGINT', () => resolve()));
    }
  } finally {
    for (const child of children) child.kill('SIGTERM');
    try {
      execSync(`dropdb --if-exists ${DB}`);
    } catch {
      /* still in use; dropped on the next run */
    }
  }
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`\n❌ ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  });
