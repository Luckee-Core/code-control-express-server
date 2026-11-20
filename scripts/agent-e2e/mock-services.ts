/**
 * Local test doubles for the agent E2E: an in-memory GitHub REST subset (repos, refs, trees,
 * commits, contents, pulls, merge, compare) and an Anthropic Messages streaming endpoint whose
 * answers are produced by a callback. Never used by the app.
 */
import crypto from 'crypto';
import http from 'http';
import { unifiedDiff } from '../../src/utils/text/unified-diff';

type Tree = Map<string, string>;
type Commit = { sha: string; tree: string; parents: string[]; message: string };
type Pull = { number: number; title: string; body: string; head: string; base: string; state: 'open' | 'closed'; merged: boolean; merge_commit_sha: string | null; comments: string[] };
type Repo = { default_branch: string; trees: Map<string, Tree>; commits: Map<string, Commit>; refs: Map<string, string>; pulls: Pull[] };

const sha = (value: unknown): string => crypto.createHash('sha1').update(JSON.stringify(value) + Math.random()).digest('hex');

export class MockGithub {
  repos = new Map<string, Repo>();

  /** Creates a repo whose default branch has one commit with these files. */
  createRepo(fullName: string, files: Record<string, string>): string {
    const repo: Repo = { default_branch: 'main', trees: new Map(), commits: new Map(), refs: new Map(), pulls: [] };
    this.repos.set(fullName, repo);
    const commit = this.commit(fullName, null, files, 'initial');
    repo.refs.set('main', commit);
    return commit;
  }

  /** New commit on top of `parent` with files overlaid; returns its sha (refs untouched). */
  commit(fullName: string, parent: string | null, files: Record<string, string>, message: string): string {
    const repo = this.repos.get(fullName)!;
    const base = parent ? repo.trees.get(repo.commits.get(parent)!.tree)! : new Map<string, string>();
    const tree = new Map(base);
    for (const [path, content] of Object.entries(files)) tree.set(path, content);
    const treeSha = sha([...tree.entries()]);
    repo.trees.set(treeSha, tree);
    const commitSha = sha({ treeSha, parent, message });
    repo.commits.set(commitSha, { sha: commitSha, tree: treeSha, parents: parent ? [parent] : [], message });
    return commitSha;
  }

  treeAt(fullName: string, ref: string): Tree | null {
    const repo = this.repos.get(fullName);
    if (!repo) return null;
    const commitSha = repo.refs.get(ref) ?? ref;
    const commit = repo.commits.get(commitSha);
    return commit ? repo.trees.get(commit.tree)! : null;
  }

  handle(method: string, url: URL, body: Record<string, unknown> | null): { status: number; json: unknown } {
    const match = /^\/repos\/([^/]+)\/([^/]+)(\/.*)?$/.exec(url.pathname);
    if (!match) return { status: 404, json: { message: 'Not Found' } };
    const fullName = `${decodeURIComponent(match[1])}/${decodeURIComponent(match[2])}`;
    const repo = this.repos.get(fullName);
    if (!repo) return { status: 404, json: { message: `No repo ${fullName}` } };
    const rest = match[3] ?? '';
    const not = { status: 404, json: { message: 'Not Found' } };

    if (method === 'GET' && rest === '') return { status: 200, json: { default_branch: repo.default_branch } };

    let m = /^\/git\/ref\/heads\/(.+)$/.exec(rest);
    if (method === 'GET' && m) {
      const value = repo.refs.get(decodeURIComponent(m[1]));
      return value ? { status: 200, json: { object: { sha: value } } } : not;
    }
    m = /^\/git\/refs\/heads\/(.+)$/.exec(rest);
    if (m && method === 'PATCH') {
      const branch = decodeURIComponent(m[1]);
      if (!repo.refs.has(branch)) return { status: 422, json: { message: 'Reference does not exist' } };
      repo.refs.set(branch, String(body?.sha));
      return { status: 200, json: { object: { sha: body?.sha } } };
    }
    if (m && method === 'DELETE') {
      repo.refs.delete(decodeURIComponent(m[1]));
      return { status: 204, json: null };
    }
    if (method === 'POST' && rest === '/git/refs') {
      repo.refs.set(String(body?.ref).replace(/^refs\/heads\//, ''), String(body?.sha));
      return { status: 201, json: { ref: body?.ref } };
    }
    m = /^\/git\/commits\/([0-9a-f]+)$/.exec(rest);
    if (method === 'GET' && m) {
      const commit = repo.commits.get(m[1]);
      return commit ? { status: 200, json: { sha: commit.sha, tree: { sha: commit.tree } } } : not;
    }
    if (method === 'POST' && rest === '/git/trees') {
      const base = repo.trees.get(String(body?.base_tree)) ?? new Map<string, string>();
      const tree = new Map(base);
      for (const entry of (body?.tree as Array<{ path: string; content: string }>) ?? []) tree.set(entry.path, entry.content);
      const treeSha = sha([...tree.entries()]);
      repo.trees.set(treeSha, tree);
      return { status: 201, json: { sha: treeSha } };
    }
    if (method === 'POST' && rest === '/git/commits') {
      const commitSha = sha(body);
      repo.commits.set(commitSha, { sha: commitSha, tree: String(body?.tree), parents: (body?.parents as string[]) ?? [], message: String(body?.message) });
      return { status: 201, json: { sha: commitSha } };
    }
    m = /^\/git\/trees\/([0-9a-f]+)$/.exec(rest);
    if (method === 'GET' && m) {
      const tree = this.treeAt(fullName, m[1]);
      return tree ? { status: 200, json: { tree: [...tree.keys()].map((path) => ({ path, type: 'blob' })), truncated: false } } : not;
    }
    m = /^\/contents\/(.+)$/.exec(rest);
    if (method === 'GET' && m) {
      const path = m[1].split('/').map(decodeURIComponent).join('/');
      const tree = this.treeAt(fullName, url.searchParams.get('ref') ?? repo.default_branch);
      if (!tree) return not;
      if (tree.has(path)) return { status: 200, json: { content: Buffer.from(tree.get(path)!).toString('base64'), encoding: 'base64' } };
      const children = [...tree.keys()].filter((item) => item.startsWith(`${path}/`) && !item.slice(path.length + 1).includes('/'));
      return children.length > 0 ? { status: 200, json: children.map((item) => ({ name: item.split('/').pop(), type: 'file' })) } : not;
    }
    if (method === 'GET' && rest === '/pulls') {
      const head = (url.searchParams.get('head') ?? '').split(':')[1];
      return { status: 200, json: repo.pulls.filter((pull) => pull.state === 'open' && (!head || pull.head === head)).map((pull) => this.pullJson(fullName, pull)) };
    }
    if (method === 'POST' && rest === '/pulls') {
      const pull: Pull = { number: repo.pulls.length + 1, title: String(body?.title), body: String(body?.body), head: String(body?.head), base: String(body?.base), state: 'open', merged: false, merge_commit_sha: null, comments: [] };
      repo.pulls.push(pull);
      return { status: 201, json: this.pullJson(fullName, pull) };
    }
    m = /^\/pulls\/(\d+)(\/merge)?$/.exec(rest);
    if (m) {
      const pull = repo.pulls.find((item) => item.number === Number(m![1]));
      if (!pull) return not;
      if (method === 'GET' && !m[2]) return { status: 200, json: this.pullJson(fullName, pull) };
      if (method === 'PATCH' && !m[2]) {
        if (body?.state === 'closed') pull.state = 'closed';
        return { status: 200, json: this.pullJson(fullName, pull) };
      }
      if (method === 'PUT' && m[2]) {
        if (pull.state !== 'open') return { status: 405, json: { message: 'Pull Request is not mergeable' } };
        const headTree = this.treeAt(fullName, pull.head)!;
        const merged = this.commit(fullName, repo.refs.get(pull.base)!, Object.fromEntries(headTree), String(body?.commit_title));
        repo.refs.set(pull.base, merged);
        pull.state = 'closed';
        pull.merged = true;
        pull.merge_commit_sha = merged;
        return { status: 200, json: { merged: true, sha: merged } };
      }
    }
    m = /^\/issues\/(\d+)\/comments$/.exec(rest);
    if (method === 'POST' && m) {
      repo.pulls.find((item) => item.number === Number(m![1]))?.comments.push(String(body?.body));
      return { status: 201, json: { id: 1 } };
    }
    m = /^\/compare\/(.+)\.\.\.(.+)$/.exec(rest);
    if (method === 'GET' && m) {
      const base = this.treeAt(fullName, decodeURIComponent(m[1]));
      const head = this.treeAt(fullName, decodeURIComponent(m[2]));
      if (!base || !head) return not;
      const files = [...new Set([...base.keys(), ...head.keys()])]
        .filter((path) => base.get(path) !== head.get(path))
        .map((path) => ({ filename: path, status: !base.has(path) ? 'added' : !head.has(path) ? 'removed' : 'modified', additions: 1, deletions: 1, patch: unifiedDiff(base.get(path) ?? '', head.get(path) ?? '') }));
      return { status: 200, json: { files } };
    }
    return { status: 404, json: { message: `Mock GitHub: unhandled ${method} ${rest}` } };
  }

  private pullJson(fullName: string, pull: Pull) {
    const repo = this.repos.get(fullName)!;
    return {
      number: pull.number,
      html_url: `https://github.example/${fullName}/pull/${pull.number}`,
      state: pull.state,
      merged: pull.merged,
      merged_at: pull.merged ? new Date().toISOString() : null,
      merge_commit_sha: pull.merge_commit_sha,
      head: { ref: pull.head, sha: repo.refs.get(pull.head) ?? '' },
      base: { ref: pull.base },
    };
  }
}

/** Answers one Messages request: return the JSON object the model should produce. */
export type AiResponder = (input: { system: string; user: string }) => unknown;

const sse = (event: string, data: unknown): string => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

/** Starts both doubles on one port: /repos/* → GitHub, /v1/messages → Anthropic (streaming). */
export const startMockServer = (port: number, github: MockGithub, ai: AiResponder): Promise<http.Server> =>
  new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let raw = '';
      req.on('data', (chunk) => (raw += chunk));
      req.on('end', () => {
        const url = new URL(req.url ?? '/', `http://127.0.0.1:${port}`);
        const body = raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
        if (url.pathname === '/v1/messages') {
          const system = typeof body?.system === 'string' ? body.system : JSON.stringify(body?.system);
          const messages = body?.messages as Array<{ content: string }>;
          let text: string;
          try {
            text = JSON.stringify(ai({ system, user: String(messages?.[0]?.content ?? '') }));
          } catch (error) {
            res.writeHead(500, { 'content-type': 'application/json' });
            res.end(JSON.stringify({ type: 'error', error: { type: 'api_error', message: String(error) } }));
            return;
          }
          res.writeHead(200, { 'content-type': 'text/event-stream' });
          res.write(sse('message_start', { type: 'message_start', message: { id: 'msg_mock', type: 'message', role: 'assistant', model: String(body?.model), content: [], stop_reason: null, stop_sequence: null, usage: { input_tokens: Math.ceil(raw.length / 4), output_tokens: 1 } } }));
          res.write(sse('content_block_start', { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } }));
          for (let index = 0; index < text.length; index += 4000) {
            res.write(sse('content_block_delta', { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: text.slice(index, index + 4000) } }));
          }
          res.write(sse('content_block_stop', { type: 'content_block_stop', index: 0 }));
          res.write(sse('message_delta', { type: 'message_delta', delta: { stop_reason: 'end_turn', stop_sequence: null }, usage: { output_tokens: Math.ceil(text.length / 4) } }));
          res.write(sse('message_stop', { type: 'message_stop' }));
          res.end();
          return;
        }
        const result = github.handle(req.method ?? 'GET', url, body);
        res.writeHead(result.status, { 'content-type': 'application/json' });
        res.end(result.json === null ? '' : JSON.stringify(result.json));
      });
    });
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
