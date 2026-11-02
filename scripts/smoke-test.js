#!/usr/bin/env node
'use strict';

/**
 * Tes end-to-end offline. Tidak butuh internet / akun GitHub:
 * - membuat session & akun palsu langsung ke store (hanya untuk tes)
 * - membuat bare repo + work repo lokal
 * - menjalankan push / pull / commit lewat REST API
 * - memverifikasi metadata from → to dan riwayat aktivitas
 */
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TMP = await fsp.mkdtemp(path.join(os.tmpdir(), 'ghc-test-'));
const DATA = path.join(TMP, 'data');
const WORK = path.join(TMP, 'workspace');
const BARE = path.join(TMP, 'remote.git');
const REPO = path.join(WORK, 'demo-repo');
const PORT = 4300 + Math.floor(Math.random() * 400);
const BASE = `http://127.0.0.1:${PORT}`;

process.env.GHC_DATA_DIR = DATA;
process.env.GHC_WORKSPACE_ROOTS = WORK;
process.env.HOST = '127.0.0.1';
process.env.PORT = String(PORT);

const { accounts, sessions, publicAccount } = await import('../server/lib/store.js');
const { ensureDataDir } = await import('../server/lib/config.js');
const { findOnPath, ensureAskpass } = await import('../server/lib/git.js');

let passed = 0;
let failed = 0;
function check(label, condition, extra = '') {
  if (condition) { passed += 1; console.log(`  ✓ ${label}`); }
  else { failed += 1; console.error(`  ✗ ${label} ${extra}`); }
}

const run = (cmd, args, cwd) => {
  const r = spawnSync(cmd, args, { cwd, encoding: 'utf8', env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } });
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(' ')} gagal: ${r.stderr}`);
  return r.stdout;
};

async function request(pathname, { method = 'GET', body, token } = {}) {
  const res = await fetch(`${BASE}${pathname}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let data = {};
  try { data = await res.json(); } catch { /* ignore */ }
  return { status: res.status, data };
}

async function rawPost(pathname, raw, headers = {}) {
  const res = await fetch(`${BASE}${pathname}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: raw,
  });
  let data = {};
  try { data = await res.json(); } catch { /* ignore */ }
  return { status: res.status, data };
}

async function waitServer(timeoutMs = 12000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${BASE}/api/bootstrap`);
      if (res.ok) return true;
    } catch { /* belum siap */ }
    await new Promise((r) => setTimeout(r, 200));
  }
  return false;
}

let server;
try {
  console.log('\n  GitHub Changer — smoke test\n  ─────────────────────────────────────────────');
  await fsp.mkdir(WORK, { recursive: true });
  await ensureDataDir();

  // Repo lokal + remote bare (tanpa jaringan)
  run('git', ['init', '--bare', '-b', 'main', BARE]);
  run('git', ['init', '-b', 'main', REPO]);
  run('git', ['-C', REPO, 'config', 'user.name', 'Test']);
  run('git', ['-C', REPO, 'config', 'user.email', 'test@example.com']);
  await fsp.writeFile(path.join(REPO, 'README.md'), '# demo\n');
  run('git', ['-C', REPO, 'add', 'README.md']);
  run('git', ['-C', REPO, 'commit', '-m', 'initial']);
  run('git', ['-C', REPO, 'remote', 'add', 'origin', BARE]);

  // Akun + sesi sintetis (tidak menyentuh GitHub)
  const account = await accounts.upsert({
    githubId: '999', login: 'test-user', email: 'test@example.com',
    name: 'Test', token: 'fake-token-for-local-test', kind: 'test', scopes: 'repo',
  });
  const token = await sessions.create(account.id, 1);
  check('akun & sesi dibuat', Boolean(account.id && token));
  check('findOnPath menemukan git lintas-platform', typeof findOnPath('git') === 'string' && fs.existsSync(findOnPath('git')), String(findOnPath('git')));
  check('askpass disiapkan', typeof ensureAskpass() === 'string' && fs.existsSync(ensureAskpass()));

  // Regresi Windows: process.platform = win32, where.exe tidak ada, hanya git.EXE di PATH.
  const winScript = `
    import fs from 'node:fs';
    import { pathToFileURL } from 'node:url';
    Object.defineProperty(process, 'platform', { value: 'win32' });
    process.env.PATHEXT = '.COM;.EXE;.BAT;.CMD';
    process.env.GHC_DATA_DIR = ${JSON.stringify(path.join(TMP, 'windata'))};
    const bin = fs.mkdtempSync(${JSON.stringify(path.join(TMP, 'winbin-'))});
    fs.writeFileSync(bin + '/git.EXE', '', { mode: 0o755 });
    process.env.PATH = bin;
    const mod = await import(pathToFileURL(${JSON.stringify(path.join(ROOT, 'server/lib/git.js'))}).href);
    const found = mod.findOnPath('git');
    const askpass = mod.ensureAskpass();
    if (!found || !/git\\.exe$/i.test(found) || !askpass.endsWith('.cmd') || !fs.existsSync(askpass)) process.exit(1);
  `;
  const winSim = spawnSync(process.execPath, ['--input-type=module', '-e', winScript], { encoding: 'utf8' });
  check('simulasi Windows: deteksi git.exe + wrapper askpass .cmd', winSim.status === 0, winSim.stderr);

  server = spawn(process.execPath, ['server/index.js'], {
    cwd: ROOT, env: process.env, stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stderr.on('data', (d) => process.stderr.write(`[server] ${d}`));
  check('server menyala', await waitServer());

  const boot = await request('/api/bootstrap', { token });
  check('bootstrap terotentikasi', boot.data.authenticated === true, JSON.stringify(boot.data.error));
  check('git terdeteksi', boot.data.environment?.git?.ok === true);
  check('root project valid', boot.data.environment?.roots?.[0]?.exists === true);
  check('tidak ada root path yang tidak ada', boot.data.environment?.roots?.every((r) => r.exists) === true, JSON.stringify(boot.data.environment?.roots));
  check('info platform & askpass', typeof boot.data.environment?.isWindows === 'boolean' && Boolean(boot.data.environment?.askpass));
  check('deteksi folder bersarang tersedia', typeof boot.data.app?.nestedCheckout === 'boolean' && typeof boot.data.app?.suggestedParent === 'string');
  check('saran clone terdeteksi dari origin', typeof boot.data.suggestedClone?.url === 'string' && typeof boot.data.suggestedClone?.name === 'string', JSON.stringify(boot.data.suggestedClone));
  check('folder tujuan clone tersedia', Array.isArray(boot.data.cloneTargets) && boot.data.cloneTargets.length > 0);
  check('konfigurasi OAuth tidak bocor', typeof boot.data.config?.auth?.clientId === 'string');

  const noAuth = await request('/api/repos');
  check('endpoint tanpa auth ditolak', noAuth.status === 401, `status ${noAuth.status}`);

  const params = await request('/api/parameters', { token });
  check('parameter terekspos', Array.isArray(params.data.fields) && params.data.fields.length > 20, `jumlah ${params.data.fields?.length}`);
  check('parameter git.authHost ada', params.data.fields?.some((f) => f.path === 'git.authHost') === true);

  const absoluteGit = await request('/api/config', { method: 'PUT', token, body: { values: { 'git.binary': '/usr/bin/git' } } });
  check('git.binary path absolut bisa disimpan', absoluteGit.status === 200);
  const envGit = await request('/api/environment', { token });
  check('git path absolut terdeteksi', envGit.data.environment?.git?.path === '/usr/bin/git' && envGit.data.environment?.git?.ok === true, JSON.stringify(envGit.data.environment?.git));
  await request('/api/config/reset', { method: 'POST', token, body: { keys: ['git.binary'] } });

  const saved = await request('/api/config', { method: 'PUT', token, body: { values: { 'git.defaultBranch': 'main', 'ui.accent': 'mint' } } });
  check('parameter bisa disimpan', saved.data.config?.ui?.accent === 'mint');
  const reset = await request('/api/config/reset', { method: 'POST', token, body: { keys: ['ui.accent'] } });
  check('parameter bisa direset', reset.data.config?.ui?.accent === 'aurora');

  const probe = await request('/api/environment/probe', { method: 'POST', token, body: { path: REPO } });
  check('probe path repo', probe.data.probe?.isRepo === true && probe.data.probe?.insideRoots === true);

  const repos = await request('/api/repos?refresh=1', { token });
  check('repo terdeteksi', repos.data.repos?.length === 1, JSON.stringify(repos.data.repos));
  check('info remote terbaca', repos.data.repos?.[0]?.remotes?.[0]?.pushUrl === BARE);

  const detail = await request(`/api/repos/detail?path=${encodeURIComponent(REPO)}`, { token });
  check('detail repo + log', detail.data.repo?.commits?.length >= 1);

  const devStart = await request('/api/auth/device/start', { method: 'POST', body: {} });
  check('device flow tanpa Client ID ditolak rapi', devStart.status === 400 && /Client ID/.test(devStart.data.error || ''));

  const outside = await request('/api/git', { method: 'POST', token, body: { action: 'push', params: { path: '/etc' } } });
  check('path di luar root ditolak', outside.status === 400 || outside.status === 403, `status ${outside.status}`);

  // Push pertama (dengan -u otomatis)
  const push = await request('/api/git', { method: 'POST', token, body: { action: 'push', params: { path: REPO, remote: 'origin', branch: 'main' } } });
  check('push berhasil', push.data.result?.ok === true, push.data.result?.output);
  check('push punya metadata from', /main/.test(push.data.entry?.from?.label || ''));
  check('push punya metadata to (URL remote)', (push.data.entry?.to?.url || '') === BARE, push.data.entry?.to?.url);
  check('push tercatat atas email akun', push.data.entry?.email === 'test@example.com');
  check('perintah git tidak mengandung token', !/fake-token/.test(push.data.entry?.command || ''));

  // Commit lewat API (harus pakai email akun aktif)
  await fsp.writeFile(path.join(REPO, 'fitur.txt'), 'halo\n');
  const commit = await request('/api/git', { method: 'POST', token, body: { action: 'commit', params: { path: REPO, message: 'feat: fitur baru' } } });
  check('commit berhasil', commit.data.result?.ok === true, commit.data.result?.output);
  const author = run('git', ['-C', REPO, 'log', '-1', '--format=%ae']).trim();
  check('commit memakai email GitHub aktif', author === 'test@example.com', author);

  const push2 = await request('/api/git', { method: 'POST', token, body: { action: 'push', params: { path: REPO } } });
  check('push kedua berhasil', push2.data.result?.ok === true, push2.data.result?.output);

  // Pull dari remote
  const pull = await request('/api/git', { method: 'POST', token, body: { action: 'pull', params: { path: REPO } } });
  check('pull berhasil', pull.data.result?.ok === true, pull.data.result?.output);
  check('pull mencatat sumber remote', (pull.data.entry?.from?.url || '') === BARE);

  const fetchRes = await request('/api/git', { method: 'POST', token, body: { action: 'fetch', params: { path: REPO } } });
  check('fetch berhasil', fetchRes.data.result?.ok === true, fetchRes.data.result?.output);

  const activity = await request('/api/activity', { token });
  const ops = (activity.data.entries || []).map((e) => e.op);
  check('riwayat berisi push', ops.includes('push'));
  check('riwayat berisi pull', ops.includes('pull'));
  check('statistik tujuan push', activity.data.stats?.destinations?.[0]?.count >= 2, JSON.stringify(activity.data.stats?.destinations));
  check('statistik sumber pull', activity.data.stats?.origins?.[0]?.count >= 1);

  // Clone + init ke dalam root
  const clone = await request('/api/git', { method: 'POST', token, body: { action: 'clone', params: { url: `file://${BARE}`, name: 'cloned', root: WORK, branch: 'main' } } });
  // file:// sengaja ditolak oleh validator URL (hanya https/git@/ssh/git://) -> uji validasi
  check('URL clone tidak aman ditolak', clone.status === 400, `status ${clone.status}`);

  const init = await request('/api/git', { method: 'POST', token, body: { action: 'init', params: { name: 'fresh', root: WORK, branch: 'main' } } });
  check('init repo baru berhasil', init.data.result?.ok === true, init.data.result?.output);
  const init2 = await request('/api/git', { method: 'POST', token, body: { action: 'init', params: { name: 'fresh', root: WORK, branch: 'main' } } });
  check('clone/init anti-bentrok nama folder', init2.data.result?.ok === true && /fresh-2$/.test(init2.data.result?.path || ''), init2.data.result?.path);

  const ctx = await request('/api/arena/context', { token });
  check('konteks Arena AI ada', (ctx.data.context?.text || '').includes('Branch:'));
  check('konteks memuat akun aktif', (ctx.data.context?.text || '').includes('test@example.com'));

  // ----------------------------- Automasi -----------------------------
  const autoStatus = await request('/api/automation', { token });
  check('status automasi tersedia', typeof autoStatus.data.status?.running === 'boolean' && Boolean(autoStatus.data.config), JSON.stringify(autoStatus.data.status));

  const autoCfg = await request('/api/config', { method: 'PUT', token, body: { values: {
    'automation.action': 'fetch', 'automation.repos': [REPO], 'automation.onlyClean': false,
    'automation.webhookEnabled': true, 'automation.webhookSecret': 'rahasia-tes',
    'automation.webhookAction': 'fetch', 'automation.webhookBranch': '',
  } } });
  check('parameter automasi bisa disimpan', autoCfg.data.config?.automation?.action === 'fetch');

  const toggleOn = await request('/api/automation/toggle', { method: 'POST', token, body: { enabled: true } });
  check('scheduler bisa diaktifkan', toggleOn.data.enabled === true);

  const manual = await request('/api/automation/run', { method: 'POST', token, body: {} });
  check('run manual memproses repo', manual.data.result?.ok >= 1 && manual.data.result?.trigger === 'manual', JSON.stringify(manual.data.result));

  const payload = { ref: 'refs/heads/main', repository: { full_name: 'local/test', clone_url: BARE, html_url: BARE } };
  const raw = JSON.stringify(payload);
  const signature = `sha256=${crypto.createHmac('sha256', 'rahasia-tes').update(raw).digest('hex')}`;
  const ping = await rawPost('/webhook/github', JSON.stringify({ zen: 'Keep it logically awesome.' }), { 'X-GitHub-Event': 'ping' });
  check('webhook ping dibalas pong', ping.status === 200 && ping.data.message === 'pong');
  const badSig = await rawPost('/webhook/github', raw, { 'X-GitHub-Event': 'push', 'X-Hub-Signature-256': 'sha256=invalid' });
  check('webhook signature palsu ditolak', badSig.status === 401, `status ${badSig.status}`);
  const hook = await rawPost('/webhook/github', raw, { 'X-GitHub-Event': 'push', 'X-Hub-Signature-256': signature });
  check('webhook push valid menjalankan sync', hook.status === 200 && hook.data.matched >= 1 && hook.data.result?.ok >= 1, JSON.stringify(hook.data).slice(0, 220));

  await request('/api/config', { method: 'PUT', token, body: { values: { 'automation.webhookRepository': 'local/test' } } });
  const otherRepo = JSON.stringify({ ...payload, repository: { ...payload.repository, full_name: 'orang/lain' } });
  const otherSig = `sha256=${crypto.createHmac('sha256', 'rahasia-tes').update(otherRepo).digest('hex')}`;
  const filtered = await rawPost('/webhook/github', otherRepo, { 'X-GitHub-Event': 'push', 'X-Hub-Signature-256': otherSig });
  check('webhook membatasi repo lewat webhookRepository', filtered.status === 200 && filtered.data.skipped && /webhookRepository/.test(filtered.data.reason || ''), JSON.stringify(filtered.data).slice(0, 200));

  const afterAuto = await request('/api/activity', { token });
  check('run automasi tercatat dengan trigger', (afterAuto.data.entries || []).some((e) => e.trigger === 'webhook' || e.trigger === 'manual'));
  await request('/api/automation/toggle', { method: 'POST', token, body: { enabled: false } });

  const html = await fetch(`${BASE}/`);
  check('halaman UI tersedia', html.status === 200 && (await html.text()).includes('GitHub Changer'));
  const css = await fetch(`${BASE}/styles.css`);
  check('CSS tersedia', css.status === 200);

  // Server kedua di port yang sama harus keluar rapi, bukan stack trace EADDRINUSE.
  const duplicate = spawnSync(process.execPath, ['server/index.js'], {
    cwd: ROOT, env: process.env, encoding: 'utf8', timeout: 10000,
  });
  const dupOut = `${duplicate.stdout || ''}${duplicate.stderr || ''}`;
  check('EADDRINUSE ditangani dengan pesan ramah', duplicate.status === 1 && /sedang dipakai/.test(dupOut), `status ${duplicate.status} · ${dupOut.slice(-160)}`);

  console.log(`\n  Hasil: ${passed} lolos, ${failed} gagal\n`);
} catch (error) {
  failed += 1;
  console.error('\n  ✗ Tes error:', error);
} finally {
  if (server) { server.kill('SIGTERM'); await new Promise((r) => setTimeout(r, 300)); server.kill('SIGKILL'); }
  await fsp.rm(TMP, { recursive: true, force: true }).catch(() => {});
  if (!fs.existsSync(path.join(ROOT, 'data/secret.key'))) {
    await fsp.rm(path.join(ROOT, 'data'), { recursive: true, force: true }).catch(() => {});
  }
}

process.exit(failed ? 1 : 0);
