'use strict';

/** Router REST API + Server-Sent Events. */
import path from 'node:path';
import { realpathSync } from 'node:fs';
import { PROJECT_ROOT, DATA_DIR, loadConfig, parameters, saveConfig, resetConfig } from './lib/config.js';
import { accounts, activity, paths as dataPaths } from './lib/store.js';
import * as auth from './lib/auth.js';
import * as github from './lib/github.js';
import * as git from './lib/git.js';
import { HttpError, ok, fail, readBody, json } from './lib/util.js';

const VERSION = '1.0.0';
const SETUP_KEYS = new Set(['auth.clientId', 'ui.theme', 'ui.accent', 'workspace.roots', 'git.binary']);
let reposCache = { key: '', at: 0, value: null };

function publicConfig(cfg) {
  return {
    server: cfg.server,
    workspace: cfg.workspace,
    git: cfg.git,
    auth: { ...cfg.auth },
    arena: cfg.arena,
    ui: cfg.ui,
    activity: cfg.activity,
  };
}

export async function handleApi(req, res, url, bus) {
  const method = req.method.toUpperCase();
  const route = url.pathname;
  const cfg = loadConfig();
  const ctx = auth.authContext(req, url);
  const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

  if (isMutation) {
    const contentType = req.headers['content-type'] || '';
    if (contentType && !contentType.includes('application/json')) {
      throw new HttpError(415, 'Content-Type harus application/json');
    }
    auth.assertSameOrigin(req, url);
  }

  const isAuthFree = [
    '/api/bootstrap',
    '/api/auth/device/start',
    '/api/auth/device/poll',
    '/api/auth/device/cancel',
    '/api/auth/pat',
  ].includes(route);

  // PIN gate (opsional via APP_PIN). Bootstrap selalu bisa diakses supaya UI bisa minta PIN.
  if (route !== '/api/bootstrap') auth.requirePin(ctx);

  // Mode setup awal: sebelum akun pertama ada, izinkan baca parameter &
  // lingkungan serta menyimpan Client ID (tanpa itu tidak bisa login sama sekali).
  const setupMode = accounts.count() === 0;
  const setupAllowed = (route === '/api/config' && method === 'PUT')
    || (setupMode && method === 'GET' && ['/api/parameters', '/api/environment'].includes(route));
  if (!isAuthFree && route !== '/api/bootstrap' && !setupAllowed) {
    auth.requireAuth(ctx);
  }

  const body = isMutation ? await readBody(req) : {};

  // ----------------------------- Bootstrap -----------------------------
  if (route === '/api/bootstrap' && method === 'GET') {
    const env = await git.environment(cfg);
    return ok(res, {
      app: { name: 'GitHub Changer', version: VERSION, projectRoot: PROJECT_ROOT, dataDir: DATA_DIR, activityFile: dataPaths.ACTIVITY_FILE, time: new Date().toISOString() },
      config: publicConfig(cfg),
      oauthReady: Boolean(cfg.auth.clientId),
      authenticated: ctx.authenticated && ctx.pinOk,
      account: ctx.pinOk ? ctx.account : null,
      accounts: ctx.pinOk && ctx.authenticated ? accounts.list() : [],
      accountCount: accounts.count(),
      activeAccountId: ctx.pinOk ? ctx.account?.id || null : null,
      pinRequired: ctx.pinRequired,
      pinOk: ctx.pinOk,
      suggestedClone: env.suggested,
      cloneTargets: env.cloneTargets,
      environment: {
        git: env.git, gh: env.gh, node: env.node, platform: env.platform,
        roots: env.roots, projectRoot: env.projectRoot, askpass: env.askpass,
      },
    });
  }

  // ----------------------------- Parameter -----------------------------
  if (route === '/api/parameters' && method === 'GET') {
    if (!ctx.authenticated && accounts.count() > 0) throw new HttpError(401, 'Belum login.');
    return ok(res, { fields: parameters(), config: publicConfig(cfg) });
  }

  if (route === '/api/config' && method === 'PUT') {
    if (!ctx.authenticated) {
      // Mode setup awal: hanya boleh mengisi parameter esensial sebelum akun pertama ada.
      if (accounts.count() > 0) throw new HttpError(401, 'Belum login.');
      const keys = Object.keys(body.values || {});
      const forbidden = keys.filter((k) => !SETUP_KEYS.has(k));
      if (forbidden.length) throw new HttpError(403, `Sebelum login hanya boleh mengubah: ${[...SETUP_KEYS].join(', ')}`);
      if (!body.values || !Object.keys(body.values).length) throw new HttpError(400, 'Tidak ada parameter yang dikirim.');
    }
    const next = await saveConfig(body.values);
    return ok(res, { config: publicConfig(next), fields: parameters() });
  }

  if (route === '/api/config/reset' && method === 'POST') {
    const next = await resetConfig(body.keys);
    return ok(res, { config: publicConfig(next), fields: parameters() });
  }

  if (route === '/api/environment' && method === 'GET') {
    return ok(res, { environment: await git.environment(cfg) });
  }

  if (route === '/api/environment/probe' && method === 'POST') {
    const fs = await import('node:fs/promises');
    const input = path.resolve(String(body.path || ''));
    let stat = null;
    try { stat = await fs.stat(input); } catch { /* not found */ }
    const roots = git.rootRealpaths(cfg);
    let inside = false;
    try {
      const real = realpathSync(input);
      inside = roots.some((r) => real === r.real || real.startsWith(r.real + path.sep));
    } catch { /* ignore */ }
    return ok(res, {
      probe: {
        path: input,
        exists: Boolean(stat),
        isDir: stat?.isDirectory() || false,
        isRepo: stat ? await fs.access(path.join(input, '.git')).then(() => true).catch(() => false) : false,
        insideRoots: inside,
      },
    });
  }

  // ----------------------------- Otentikasi -----------------------------
  if (route === '/api/auth/device/start' && method === 'POST') {
    return ok(res, { flow: await auth.startDeviceFlow(cfg) });
  }

  if (route === '/api/auth/device/poll' && method === 'POST') {
    const result = await auth.pollDeviceFlow(cfg, String(body.flowId || ''));
    if (result.status === 'success') {
      res.setHeader('Set-Cookie', auth.sessionCookie(result.sessionToken, cfg.auth.sessionDays));
      bus.emit('auth', { type: 'login', login: result.account.login });
      return ok(res, { status: 'success', account: result.account, sessionToken: result.sessionToken, accounts: accounts.list() });
    }
    return ok(res, result);
  }

  if (route === '/api/auth/device/cancel' && method === 'POST') {
    return ok(res, await auth.cancelDeviceFlow(String(body.flowId || '')));
  }

  if (route === '/api/auth/pat' && method === 'POST') {
    const result = await auth.loginWithPat(cfg, body.token);
    res.setHeader('Set-Cookie', auth.sessionCookie(result.sessionToken, cfg.auth.sessionDays));
    bus.emit('auth', { type: 'login', login: result.account.login });
    return ok(res, { account: result.account, sessionToken: result.sessionToken, accounts: accounts.list() });
  }

  if (route === '/api/auth/logout' && method === 'POST') {
    await auth.logout(ctx);
    res.setHeader('Set-Cookie', auth.clearCookie());
    return ok(res, { loggedOut: true });
  }

  if (route === '/api/auth/switch' && method === 'POST') {
    const result = await auth.switchAccount(ctx, cfg, String(body.accountId || ''));
    res.setHeader('Set-Cookie', auth.sessionCookie(result.sessionToken, cfg.auth.sessionDays));
    return ok(res, { account: result.account, sessionToken: result.sessionToken, accounts: accounts.list() });
  }

  if (route === '/api/accounts' && method === 'GET') {
    return ok(res, { accounts: accounts.list(), activeAccountId: ctx.account?.id || null });
  }

  if (route.startsWith('/api/accounts/') && method === 'DELETE') {
    const id = decodeURIComponent(route.split('/').at(-1));
    const removed = await accounts.remove(id);
    if (!removed) throw new HttpError(404, 'Akun tidak ditemukan.');
    const loggedOut = id === ctx.account?.id;
    if (loggedOut) res.setHeader('Set-Cookie', auth.clearCookie());
    return ok(res, { removed: true, loggedOut, accounts: accounts.list() });
  }

  // ----------------------------- Repository lokal -----------------------------
  if (route === '/api/repos' && method === 'GET') {
    const key = JSON.stringify([cfg.workspace.roots, cfg.workspace.scanDepth, cfg.workspace.maxRepos, cfg.workspace.exclude]);
    const fresh = url.searchParams.get('refresh') === '1';
    const ttl = fresh || !reposCache.value || key !== reposCache.key || Date.now() - reposCache.at > 30000;
    if (ttl) {
      reposCache = { key, at: Date.now(), value: await git.scanWithInfo(cfg) };
    }
    return ok(res, { repos: reposCache.value, scannedAt: new Date(reposCache.at).toISOString() });
  }

  if (route === '/api/repos/detail' && method === 'GET') {
    const repoPath = url.searchParams.get('path');
    if (!repoPath) throw new HttpError(400, 'Parameter path wajib diisi.');
    return ok(res, { repo: await git.repoDetail(cfg, repoPath) });
  }

  if (route === '/api/git' && method === 'POST') {
    const action = String(body.action || '');
    if (!action) throw new HttpError(400, 'Aksi Git wajib diisi.');
    const token = accounts.token(ctx.account.id);
    if (!token) throw new HttpError(401, 'Token akun tidak bisa dibaca. Login ulang.');
    const stream = cfg.activity.streamOutput !== false;
    const { entry, result } = await git.runOperation(cfg, {
      account: ctx.account,
      token,
      onOutput: stream ? (kind, payload) => bus.emit('git', { type: kind, ...(typeof payload === 'object' ? payload : { text: payload }) }) : null,
    }, action, body.params || body);

    if (action !== 'status') {
      await activity.append(entry);
      await activity.trim(cfg.activity.retention || 1000);
      reposCache.at = 0; // invalidasi cache status repo
      bus.emit('activity', { op: action, success: entry.success, summary: entry.summary });
    }
    return ok(res, { result, entry });
  }

  if (route === '/api/arena/context' && method === 'GET') {
    const repoPath = url.searchParams.get('path') || PROJECT_ROOT;
    let info = null;
    try { info = await git.repoInfo(cfg, repoPath); } catch { /* repo tidak ada */ }
    return ok(res, { context: git.arenaContext(cfg, info, ctx.account) });
  }

  // ----------------------------- Aktivitas -----------------------------
  if (route === '/api/activity' && method === 'GET') {
    const filters = {
      limit: Number(url.searchParams.get('limit') || 200),
      op: url.searchParams.get('op') || undefined,
      accountId: url.searchParams.get('accountId') || undefined,
      repo: url.searchParams.get('repo') || undefined,
    };
    return ok(res, { entries: await activity.list(filters), stats: await activity.stats() });
  }

  if (route === '/api/activity' && method === 'DELETE') {
    await activity.clear();
    reposCache.at = 0;
    return ok(res, { cleared: true });
  }

  // ----------------------------- GitHub API -----------------------------
  if (route === '/api/github/repos' && method === 'GET') {
    const token = accounts.token(ctx.account.id);
    const { data, rate } = await github.listRepos(token, { page: Number(url.searchParams.get('page') || 1) });
    return ok(res, {
      rate,
      repos: (Array.isArray(data) ? data : []).map((r) => ({
        id: r.id, name: r.name, fullName: r.full_name, private: r.private,
        description: r.description || '', htmlUrl: r.html_url, cloneUrl: r.clone_url,
        sshUrl: r.ssh_url, defaultBranch: r.default_branch, updatedAt: r.updated_at,
        pushedAt: r.pushed_at, language: r.language, stargazers: r.stargazers_count,
        forks: r.forks_count, archived: r.archived, fork: r.fork, size: r.size,
        owner: r.owner?.login, visibility: r.visibility,
      })),
    });
  }

  if (route === '/api/github/repos' && method === 'POST') {
    const token = accounts.token(ctx.account.id);
    const name = String(body.name || '').trim();
    if (!/^[\w.\-]{1,100}$/.test(name)) throw new HttpError(400, 'Nama repository tidak valid (huruf, angka, -, _, .; maks 100).');
    const { data } = await github.createRepo(token, {
      name,
      private: Boolean(body.private),
      description: String(body.description || ''),
      auto_init: Boolean(body.autoInit),
      gitignore_template: body.gitignore || undefined,
      license_template: body.license || undefined,
    });
    const entry = {
      op: 'repo:create', repo: { path: '', name: data.full_name },
      from: { label: `GitHub · ${ctx.account.email}` },
      to: { label: data.html_url, url: data.clone_url, branch: data.default_branch },
      accountId: ctx.account.id, login: ctx.account.login, email: ctx.account.email,
      success: true, durationMs: 0, exitCode: 0, command: `POST /user/repos (${name})`,
      output: `Repository ${data.full_name} dibuat.`,
      summary: `Buat repository ${data.full_name}`,
    };
    await activity.append(entry);
    bus.emit('activity', { op: 'repo:create', success: true, summary: entry.summary });
    return ok(res, { repo: { ...data }, entry });
  }

  if (route.startsWith('/api/github/repos/') && method === 'PATCH') {
    const token = accounts.token(ctx.account.id);
    const [, , , , owner, repoName] = route.split('/');
    const payload = {};
    for (const key of ['archived', 'private', 'description']) if (key in body) payload[key] = body[key];
    if (!Object.keys(payload).length) throw new HttpError(400, 'Tidak ada perubahan.');
    const { data } = await github.patchRepo(token, decodeURIComponent(owner), decodeURIComponent(repoName), payload);
    const op = 'archived' in payload ? (payload.archived ? 'repo:archive' : 'repo:unarchive') : 'repo:update';
    await activity.append({
      op, repo: { path: '', name: data.full_name },
      from: { label: ctx.account.email }, to: { label: data.html_url, url: data.html_url },
      accountId: ctx.account.id, login: ctx.account.login, email: ctx.account.email,
      success: true, durationMs: 0, exitCode: 0, command: `PATCH /repos/${owner}/${repoName}`,
      output: JSON.stringify(payload), summary: `${op} ${data.full_name}`,
    });
    bus.emit('activity', { op, success: true });
    return ok(res, { repo: { fullName: data.full_name, archived: data.archived, private: data.private, htmlUrl: data.html_url } });
  }

  // ----------------------------- SSE -----------------------------
  if (route === '/api/events' && method === 'GET') {
    auth.requireAuth(ctx);
    bus.subscribe(res, { time: new Date().toISOString(), login: ctx.account.login });
    return null; // koneksi tetap terbuka
  }

  throw new HttpError(404, `Endpoint tidak ditemukan: ${method} ${route}`);
}

export function apiFail(res, error) { return fail(res, error); }
export function apiJson(res, status, payload) { return json(res, status, payload); }
