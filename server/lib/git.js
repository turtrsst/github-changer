'use strict';

/**
 * Eksekutor Git lokal.
 * - Semua perintah lewat spawn(argv) TANPA shell -> tidak ada injeksi.
 * - Path repo wajib berada di dalam root project yang dikonfigurasi.
 * - Kredensial OAuth aktif dikirim lewat GIT_ASKPASS (env), tidak pernah
 *   masuk ke URL remote / argumen / log.
 * - Setiap operasi menghasilkan metadata `from` & `to` untuk peta alur Git.
 */
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { PROJECT_ROOT, DATA_DIR } from './config.js';
import { HttpError, truncate, uid } from './util.js';

const ASKPASS = path.join(PROJECT_ROOT, 'scripts/git-askpass.js');
const IS_WIN = process.platform === 'win32';
const SEP = '\x1f';
const SAFE_REF = /^[A-Za-z0-9._\-\/:]+$/;
const SAFE_REMOTE = /^[A-Za-z0-9._\-]+$/;
const LOG_FORMAT = `%H${SEP}%h${SEP}%an${SEP}%ae${SEP}%aI${SEP}%d${SEP}%s`;

const COMMON_GIT_PATHS = [
  'C:\\Program Files\\Git\\cmd\\git.exe',
  'C:\\Program Files (x86)\\Git\\cmd\\git.exe',
  'C:\\Program Files\\Git\\bin\\git.exe',
  path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'Git', 'cmd', 'git.exe'),
  'C:\\ProgramData\\chocolatey\\bin\\git.exe',
  path.join(os.homedir(), 'scoop', 'apps', 'git', 'current', 'cmd', 'git.exe'),
];

let binaryCache = new Map();
let askpassPath;

/**
 * Cari executable lintas-platform.
 * Windows tidak punya `which`, jadi: where.exe -> scan PATH+PATHEXT manual ->
 * lokasi instalasi umum Git for Windows. Tetap bekerja kalau Node dijalankan
 * sebagai service dengan PATH yang berbeda dari cmd user.
 */
export function findOnPath(name) {
  const locator = IS_WIN ? 'where.exe' : 'which';
  try {
    const probe = spawnSync(locator, [name], { encoding: 'utf8', timeout: 5000, windowsHide: true });
    if (probe.status === 0) {
      const first = probe.stdout.split(/\r?\n/).map((s) => s.trim()).find(Boolean);
      if (first && fs.existsSync(first)) return first;
    }
  } catch { /* lanjut ke scan manual */ }

  const extensions = IS_WIN
    ? (process.env.PATHEXT || '.COM;.EXE;.BAT;.CMD').split(';').map((e) => e.toLowerCase()).filter(Boolean)
    : [''];
  const hasExt = Boolean(path.extname(name));
  for (const dir of (process.env.PATH || '').split(path.delimiter).filter(Boolean)) {
    for (const ext of extensions) {
      const stem = ext && !hasExt ? name + ext : name;
      const candidate = path.join(dir, stem);
      try {
        if (fs.statSync(candidate).isFile()) {
          fs.accessSync(candidate, fs.constants.X_OK);
          return candidate;
        }
      } catch { /* coba kandidat berikutnya */ }
      // Windows case-insensitive: cari varian huruf walau FS-nya case-sensitive.
      if (IS_WIN) {
        try {
          const match = fs.readdirSync(dir).find((f) => f.toLowerCase() === stem.toLowerCase());
          if (match) {
            const variant = path.join(dir, match);
            fs.accessSync(variant, fs.constants.X_OK);
            return variant;
          }
        } catch { /* direktori tidak bisa dibaca / tidak cocok */ }
      }
    }
  }

  if (IS_WIN && /^git(\.exe)?$/i.test(name)) {
    for (const candidate of COMMON_GIT_PATHS) {
      try { fs.accessSync(candidate, fs.constants.X_OK); return candidate; } catch { /* ignore */ }
    }
  }
  return null;
}

/**
 * GIT_ASKPASS: script .js bershebang di POSIX; di Windows dibungkus .cmd
 * karena CreateProcess tidak bisa menjalankan shebang langsung.
 * File .cmd dibuat di data/ (gitignored) dan path node di-hardcode absolut.
 */
export function ensureAskpass() {
  if (askpassPath) return askpassPath;
  try { fs.chmodSync(ASKPASS, 0o755); } catch { /* Windows: mode tidak ada */ }
  if (IS_WIN) {
    const cmd = path.join(DATA_DIR, 'git-askpass.cmd');
    const content = `@echo off\r\n"${process.execPath}" "${ASKPASS}" %*\r\n`;
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(cmd, content);
      askpassPath = cmd;
    } catch { askpassPath = ASKPASS; }
  } else {
    askpassPath = ASKPASS;
  }
  return askpassPath;
}

export function resolveGitBinary(cfg) {
  const requested = cfg.git.binary || 'git';
  const cached = binaryCache.get(requested);
  if (cached && Date.now() - cached.at < 30000) return cached;

  let resolved = requested;
  if (!path.isAbsolute(requested)) resolved = findOnPath(requested) || requested;
  let ok = false;
  let version = '';
  try {
    fs.accessSync(resolved, fs.constants.X_OK);
    const probe = spawnSync(resolved, ['--version'], { encoding: 'utf8', timeout: 6000, windowsHide: true });
    ok = probe.status === 0;
    version = (probe.stdout || '').trim();
  } catch { ok = false; }
  const hint = IS_WIN
    ? ' (Windows: pastikan Git for Windows terinstal / ada di PATH, atau isi parameter git.binary dengan path absolut git.exe)'
    : '';
  const value = { path: resolved, requested, version, ok, error: ok ? null : `Git tidak ditemukan / tidak bisa dijalankan: ${requested}${hint}` };
  binaryCache.set(requested, { ...value, at: Date.now() });
  return value;
}

function buildEnv(cfg, token) {
  const env = { ...process.env };
  env.GIT_TERMINAL_PROMPT = '0';
  env.GIT_CONFIG_COUNT = '1';
  env.GIT_CONFIG_KEY_0 = 'credential.helper';
  env.GIT_CONFIG_VALUE_0 = '';
  const authHost = String(cfg.git.authHost || process.env.GHC_GIT_HOST || 'github.com')
    .replace(/^https?:\/\//i, '').replace(/\/+$/, '');
  if (token) {
    env.GIT_ASKPASS = ensureAskpass();
    env.GHC_GIT_TOKEN = token;
    env.GHC_GIT_HOST = authHost;
    // Jalur autentikasi utama: header HTTP lewat env (bukan argv), URL-scoped
    // sehingga bekerja di Windows tanpa askpass dan tidak bocor ke host lain.
    const basic = Buffer.from(`x-access-token:${token}`).toString('base64');
    env.GIT_CONFIG_COUNT = '2';
    env.GIT_CONFIG_KEY_1 = `http.https://${authHost}/.extraHeader`;
    env.GIT_CONFIG_VALUE_1 = `AUTHORIZATION: basic ${basic}`;
  } else {
    delete env.GIT_ASKPASS;
    delete env.GHC_GIT_TOKEN;
    delete env.GHC_GIT_HOST;
  }
  return env;
}

/** Jalankan satu perintah Git. Tidak pernah throw untuk kegagalan git itu sendiri. */
export function runGit(cfg, args, { cwd, token, timeoutMs, onData } = {}) {
  const git = resolveGitBinary(cfg);
  if (!git.ok) return Promise.resolve({ code: -1, stdout: '', stderr: git.error, durationMs: 0, command: `git ${args.join(' ')}`, timedOut: false });
  const start = Date.now();
  const timeout = timeoutMs || cfg.git.timeoutMs || 180000;
  const command = `${path.basename(git.path)} ${args.join(' ')}`;
  return new Promise((resolve) => {
    let child;
    try {
      child = spawn(git.path, args, { cwd: cwd || PROJECT_ROOT, env: buildEnv(cfg, token), stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (error) {
      resolve({ code: -1, stdout: '', stderr: error.message, durationMs: 0, command, timedOut: false });
      return;
    }
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      try { child.kill('SIGTERM'); } catch { /* ignore */ }
      setTimeout(() => { try { child.kill('SIGKILL'); } catch { /* ignore */ } }, 3000).unref?.();
    }, timeout);
    const take = (stream, chunk, kind) => {
      const text = chunk.toString('utf8');
      if (stream === 'stdout') stdout += text; else stderr += text;
      if (stdout.length > 200000) stdout = stdout.slice(-200000);
      if (stderr.length > 200000) stderr = stderr.slice(-200000);
      if (onData) onData(kind, text);
    };
    child.stdout.on('data', (c) => take('stdout', c, 'stdout'));
    child.stderr.on('data', (c) => take('stderr', c, 'stderr'));
    child.on('error', (error) => { stderr += `\n${error.message}`; });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({
        code: code === null ? -1 : code,
        stdout: truncate(stdout, 60000),
        stderr: truncate(stderr, 60000),
        durationMs: Date.now() - start,
        command,
        timedOut,
      });
    });
  });
}

/** Cek bahwa path berada di dalam salah satu root project (realpath, anti symlink escape). */
export function rootRealpaths(cfg) {
  return (cfg.workspace.roots || []).flatMap((root) => {
    try { return [{ input: root, real: fs.realpathSync(path.resolve(root)) }]; } catch { return []; }
  });
}

export function resolveInside(cfg, input, { mustExist = true } = {}) {
  const target = path.resolve(String(input || ''));
  const roots = rootRealpaths(cfg);
  if (!roots.length) throw new HttpError(400, 'Belum ada root project yang valid. Atur di halaman Parameters.');
  const probe = mustExist ? target : fs.existsSync(target) ? target : path.dirname(target);
  let real;
  try { real = fs.realpathSync(probe); } catch {
    throw new HttpError(400, `Path tidak ditemukan: ${target}`);
  }
  const isInside = (p) => roots.some((root) => p === root.real || p.startsWith(root.real + path.sep));
  if (!isInside(real)) {
    throw new HttpError(403, `Path di luar root project yang diizinkan: ${target}`);
  }
  if (mustExist && !fs.existsSync(path.join(target, '.git'))) {
    throw new HttpError(400, `Bukan repository Git: ${target}`);
  }
  return target;
}

/** Repo yang disarankan untuk di-clone lebih dulu: ambil dari `origin` project ini. */
export async function suggestedClone(cfg) {
  const [remoteRes, branchRes] = await Promise.all([
    runGit(cfg, ['-C', PROJECT_ROOT, 'remote', 'get-url', 'origin']),
    runGit(cfg, ['-C', PROJECT_ROOT, 'rev-parse', '--abbrev-ref', 'HEAD']),
  ]);
  const url = remoteRes.code === 0 ? remoteRes.stdout.trim() : '';
  const branch = branchRes.code === 0 ? branchRes.stdout.trim() : cfg.git.defaultBranch;
  const name = (url ? path.basename(url) : path.basename(PROJECT_ROOT)).replace(/\.git$/, '') || path.basename(PROJECT_ROOT);
  return { url, name, branch, sourcePath: PROJECT_ROOT, root: cfg.workspace.roots[0] || path.dirname(PROJECT_ROOT) };
}

/** Daftar folder tujuan clone: root project + subfolder langsungnya (yang bukan repo). */
export async function discoverCloneTargets(cfg, roots) {
  const exclude = new Set(cfg.workspace.exclude || []);
  const out = [];
  for (const root of roots) {
    if (!root.exists || !root.writable) continue;
    out.push(root.real);
    let entries = [];
    try { entries = await fsp.readdir(root.real, { withFileTypes: true }); } catch { continue; }
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.isSymbolicLink() || exclude.has(entry.name) || entry.name.startsWith('.')) continue;
      const candidate = path.join(root.real, entry.name);
      if (fs.existsSync(path.join(candidate, '.git'))) continue; // jangan nested repo
      try { await fsp.access(candidate, fs.constants.W_OK); out.push(candidate); } catch { /* read-only */ }
    }
  }
  return [...new Set(out)].slice(0, 40);
}

export async function environment(cfg) {
  const git = resolveGitBinary(cfg);
  const askpass = ensureAskpass();
  let gh = { ok: false, version: '' };
  try {
    const ghPath = findOnPath('gh');
    if (ghPath) {
      const probe = spawnSync(ghPath, ['--version'], { encoding: 'utf8', timeout: 4000, windowsHide: true });
      gh = { ok: probe.status === 0, version: (probe.stdout || '').trim().split('\n')[0], path: ghPath };
    }
  } catch { /* gh opsional */ }
  const roots = await Promise.all((cfg.workspace.roots || []).map(async (root) => {
    try {
      const stat = await fsp.stat(path.resolve(root));
      await fsp.access(path.resolve(root), fs.constants.R_OK | fs.constants.W_OK);
      return { path: root, exists: true, writable: true, isDir: stat.isDirectory(), real: fs.realpathSync(path.resolve(root)) };
    } catch (error) {
      return { path: root, exists: false, writable: false, isDir: false, error: error.message };
    }
  }));
  return {
    git,
    gh,
    node: process.version,
    platform: `${process.platform} (${process.arch})`,
    home: process.env.HOME || '',
    projectRoot: PROJECT_ROOT,
    dataDir: DATA_DIR,
    askpass,
    isWindows: IS_WIN,
    roots,
    suggested: await suggestedClone(cfg),
    cloneTargets: await discoverCloneTargets(cfg, roots),
  };
}

/** Pindai root project untuk folder yang punya .git. */
export async function scanRepos(cfg) {
  const exclude = new Set(cfg.workspace.exclude || []);
  const max = cfg.workspace.maxRepos || 200;
  const depth = cfg.workspace.scanDepth || 3;
  const found = [];
  const roots = rootRealpaths(cfg);

  const walk = async (dir, level) => {
    if (found.length >= max || level > depth) return;
    let entries;
    try { entries = await fsp.readdir(dir, { withFileTypes: true }); } catch { return; }
    if (entries.some((e) => e.name === '.git')) {
      found.push(dir);
      return; // jangan masuk ke dalam repo
    }
    const dirs = entries.filter((e) => e.isDirectory() && !e.isSymbolicLink() && !exclude.has(e.name) && !e.name.startsWith('.'));
    // Telusuri shallow-level dulu agar repo dekat root didahulukan
    for (const entry of dirs) {
      if (found.length >= max) break;
      await walk(path.join(dir, entry.name), level + 1);
    }
  };

  for (const root of roots) await walk(root.real, 0);
  return [...new Set(found)].slice(0, max);
}

function parseStatus(output) {
  const lines = output.split('\n').filter((line) => line.length > 0);
  const head = lines.find((line) => line.startsWith('## ')) || '';
  const branchLine = head.slice(3);
  const [tracking, ...flags] = branchLine.split(' [');
  const [branch, upstream] = tracking.split('...');
  let ahead = 0;
  let behind = 0;
  const flagText = flags.join(' [');
  const aheadMatch = flagText.match(/ahead (\d+)/);
  const behindMatch = flagText.match(/behind (\d+)/);
  if (aheadMatch) ahead = Number(aheadMatch[1]);
  if (behindMatch) behind = Number(behindMatch[1]);
  const files = lines.filter((line) => !line.startsWith('## '));
  let staged = 0; let unstaged = 0; let untracked = 0;
  const preview = [];
  for (const line of files) {
    const x = line[0] || ' ';
    const y = line[1] || ' ';
    const name = line.slice(3).trim();
    if (preview.length < 30) preview.push({ status: (x + y).trim() || '??', name });
    if (x === '?' && y === '?') untracked += 1;
    else {
      if (x !== ' ') staged += 1;
      if (y !== ' ') unstaged += 1;
    }
  }
  return {
    branch: branch === 'HEAD' ? '(detached)' : branch || '(no commits)',
    upstream: upstream || '',
    ahead, behind,
    dirty: { staged, unstaged, untracked, total: files.length, files: preview },
  };
}

function parseRemotes(output) {
  const map = new Map();
  for (const line of output.split('\n')) {
    const match = line.match(/^([^\s]+)\s+(.+?)\s+\((fetch|push)\)$/);
    if (!match) continue;
    const [, name, url, kind] = match;
    if (!map.has(name)) map.set(name, { name, fetchUrl: '', pushUrl: '' });
    if (kind === 'fetch') map.get(name).fetchUrl = url;
    else map.get(name).pushUrl = url;
  }
  return [...map.values()].map((r) => ({ ...r, pushUrl: r.pushUrl || r.fetchUrl, fetchUrl: r.fetchUrl || r.pushUrl }));
}

function parseLog(output) {
  return output.split('\n').filter(Boolean).map((line) => {
    const [sha, short, author, email, date, refs, subject] = line.split(SEP);
    return { sha, short, author, email, date, refs: (refs || '').trim(), subject };
  });
}

export async function repoInfo(cfg, repoPath) {
  const cwd = resolveInside(cfg, repoPath);
  const [
    statusRes, remoteRes, logRes, headRes, upstreamRes, countRes,
  ] = await Promise.all([
    runGit(cfg, ['status', '--porcelain=v1', '--branch'], { cwd }),
    runGit(cfg, ['remote', '-v'], { cwd }),
    runGit(cfg, ['log', '-1', `--format=${LOG_FORMAT}`], { cwd }),
    runGit(cfg, ['rev-parse', '--short', 'HEAD'], { cwd }),
    runGit(cfg, ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}'], { cwd }),
    runGit(cfg, ['rev-list', '--left-right', '--count', 'HEAD...@{upstream}'], { cwd }),
  ]);
  const status = parseStatus(statusRes.stdout);
  if (countRes.code === 0) {
    const [a, b] = countRes.stdout.trim().split(/\s+/).map(Number);
    status.ahead = Number.isFinite(a) ? a : status.ahead;
    status.behind = Number.isFinite(b) ? b : status.behind;
  }
  if (upstreamRes.code === 0) status.upstream = upstreamRes.stdout.trim();
  return {
    path: cwd,
    name: path.basename(cwd),
    isRepo: true,
    ...status,
    head: headRes.code === 0 ? headRes.stdout.trim() : '',
    remotes: parseRemotes(remoteRes.stdout),
    lastCommit: parseLog(logRes.stdout)[0] || null,
  };
}

export async function scanWithInfo(cfg) {
  const paths = await scanRepos(cfg);
  const { mapLimit } = await import('./util.js');
  const results = await mapLimit(paths, 4, (p) => repoInfo(cfg, p));
  return results.filter((r) => r.ok).map((r) => r.value).sort((a, b) => a.name.localeCompare(b.name));
}

export async function repoDetail(cfg, repoPath) {
  const info = await repoInfo(cfg, repoPath);
  const cwd = info.path;
  const [logRes, branchRes, diffRes, configRes] = await Promise.all([
    runGit(cfg, ['log', '-25', `--format=${LOG_FORMAT}`], { cwd }),
    runGit(cfg, ['branch', '-a', '--sort=-committerdate', `--format=%(refname:short)${SEP}%(upstream:short)${SEP}%(objectname:short)${SEP}%(HEAD)`], { cwd }),
    runGit(cfg, ['diff', '--stat'], { cwd }),
    runGit(cfg, ['config', '--get-regexp', '^user\\.'], { cwd }),
  ]);
  return {
    ...info,
    commits: parseLog(logRes.stdout),
    branches: branchRes.stdout.split('\n').filter(Boolean).map((line) => {
      const [name, upstream, sha, head] = line.split(SEP);
      return { name, upstream, sha, current: head === '*' };
    }),
    diffStat: diffRes.stdout.trim(),
    gitUser: configRes.stdout.trim(),
  };
}

/* ------------------------------ Operasi ------------------------------ */

function assertRef(value, label = 'ref') {
  const str = String(value || '').trim();
  if (!str || !SAFE_REF.test(str) || str.startsWith('-') || str.includes('..') || str.includes('@{')) {
    throw new HttpError(400, `${label} tidak valid: ${str}`);
  }
  return str;
}

function assertRemote(value) {
  const str = String(value || '').trim();
  if (!str || !SAFE_REMOTE.test(str) || str.startsWith('-')) throw new HttpError(400, `Nama remote tidak valid: ${str}`);
  return str;
}

function assertUrl(value) {
  const str = String(value || '').trim();
  if (!/^(https?:\/\/|git@|ssh:\/\/|git:\/\/)[^\s]+$/.test(str)) {
    throw new HttpError(400, 'URL remote harus berupa https://, git@, ssh://, atau git://');
  }
  return str;
}

function labelFor(repo, remoteName) {
  const remote = repo.remotes.find((r) => r.name === remoteName) || repo.remotes[0];
  return remote || { name: remoteName, fetchUrl: '', pushUrl: '' };
}

function outputOf(...results) {
  return results.map((r) => [r.stdout, r.stderr].filter(Boolean).join('\n')).filter(Boolean).join('\n').trim();
}

/**
 * Jalankan aksi Git + kembalikan entry aktivitas siap simpan.
 * `hooks.onOutput` dipakai untuk streaming SSE ke browser.
 */
export async function runOperation(cfg, { account, token, onOutput }, action, params = {}) {
  const opId = uid('op_');
  const start = Date.now();
  const bus = (kind, text) => { if (onOutput) onOutput(kind, text); };
  const entry = {
    op: action,
    repo: { path: '', name: params.name || '' },
    from: null,
    to: null,
    accountId: account?.id || null,
    login: account?.login || '',
    email: account?.email || '',
    success: false,
    durationMs: 0,
    exitCode: -1,
    command: '',
    output: '',
    summary: '',
    meta: {},
  };
  let result = { ok: false, output: '', code: -1 };

  const run = (args, opts = {}) => runGit(cfg, args, {
    cwd: opts.cwd,
    token,
    onData: (kind, text) => bus('output', { opId, action, kind, text }),
    ...opts,
  });

  try {
    if (action === 'clone' || action === 'init') {
      const root = params.root || cfg.workspace.roots[0];
      const baseFolder = params.name || (action === 'clone' ? String(params.url || '').split('/').pop().replace(/\.git$/, '') : '');
      if (!baseFolder || /[/\\]/.test(baseFolder) || !/^[\w.\-]+$/.test(baseFolder)) throw new HttpError(400, 'Nama folder project tidak valid.');
      const occupied = (candidate) => {
        try { return fs.existsSync(candidate) && fs.readdirSync(candidate).length > 0; } catch { return false; }
      };
      // Kalau nama folder sudah dipakai, beri suffix -2, -3, ... supaya "clone dulu" tidak pernah mentok.
      let folder = baseFolder;
      let target = resolveInside(cfg, path.join(path.resolve(root), folder), { mustExist: false });
      for (let i = 2; i <= 30 && occupied(target) && params.autoSuffix !== false; i += 1) {
        folder = `${baseFolder}-${i}`;
        target = resolveInside(cfg, path.join(path.resolve(root), folder), { mustExist: false });
      }
      if (occupied(target)) throw new HttpError(409, `Folder sudah terisi: ${target}`);
      const args = action === 'clone'
        ? ['clone', ...(params.branch ? ['--branch', assertRef(params.branch, 'branch')] : []), assertUrl(params.url), target]
        : ['init', '-b', assertRef(params.branch || cfg.git.defaultBranch, 'branch'), target];
      const res = await run(args, { cwd: path.dirname(target) });
      let remoteRes = null;
      if (action === 'init' && params.url && res.code === 0) {
        remoteRes = await run(['-C', target, 'remote', 'add', cfg.git.defaultRemote, assertUrl(params.url)], { cwd: PROJECT_ROOT });
      }
      entry.repo = { path: target, name: folder };
      entry.from = { label: action === 'clone' ? params.url : '∅ (repo baru)', url: params.url || '', branch: params.branch || '' };
      entry.to = { label: `Lokal · ${target}`, path: target, branch: params.branch || cfg.git.defaultBranch };
      entry.command = [res.command, remoteRes?.command].filter(Boolean).join(' && ');
      result = { ok: res.code === 0, code: res.code, output: outputOf(res, ...(remoteRes ? [remoteRes] : [])), path: target };
      entry.exitCode = res.code;
    } else {
      const cwd = resolveInside(cfg, params.path);
      const info = await repoInfo(cfg, cwd);
      entry.repo = { path: cwd, name: info.name };
      const remoteName = assertRemote(params.remote || info.upstream?.split('/')[0] || cfg.git.defaultRemote);
      const remote = labelFor(info, remoteName);
      const branch = assertRef(params.branch || (info.branch.startsWith('(') ? cfg.git.defaultBranch : info.branch), 'branch');
      const targetBranch = params.targetBranch ? assertRef(params.targetBranch, 'target branch') : branch;
      const branchesUrl = (url) => (url ? url.replace(/\.git$/, '') : '');

      const forceArgs = params.force ? ['--force-with-lease'] : [];
      let res;

      switch (action) {
        case 'status': {
          res = await run(['status', '--short', '--branch'], { cwd });
          entry.summary = `${info.dirty.total} perubahan di ${info.branch}`;
          break;
        }
        case 'fetch': {
          const args = ['fetch', '--prune', '--tags'];
          if (params.allRemotes || !info.remotes.length) args.push('--all');
          else args.push(remoteName);
          res = await run(args, { cwd });
          entry.from = { label: `${remoteName} · ${remote.fetchUrl}`, url: remote.fetchUrl, branch: `refs/remotes/${remoteName}/*`, remote: remoteName };
          entry.to = { label: `Lokal · ${cwd}`, path: cwd, branch: `refs/remotes/${remoteName}/*`, url: branchesUrl(remote.fetchUrl) };
          break;
        }
        case 'pull': {
          const strategyArgs = cfg.git.pullStrategy === 'rebase' ? ['--rebase']
            : cfg.git.pullStrategy === 'merge' ? ['--no-rebase'] : ['--ff-only'];
          res = await run(['pull', ...strategyArgs, remoteName, branch], { cwd });
          const headRes = await run(['rev-parse', '--short', 'HEAD'], { cwd });
          entry.from = { label: `${remoteName}/${branch} · ${remote.fetchUrl}`, url: remote.fetchUrl, branch: `${remoteName}/${branch}`, remote: remoteName, sha: info.head };
          entry.to = { label: `Lokal · ${branch} @ ${headRes.stdout.trim() || info.head}`, path: cwd, branch, sha: headRes.stdout.trim() || info.head, url: branchesUrl(remote.fetchUrl) };
          entry.meta = { strategy: cfg.git.pullStrategy };
          break;
        }
        case 'push': {
          const setUpstream = cfg.git.autoSetUpstream && !info.upstream && params.setUpstream !== false;
          const refspec = targetBranch === branch ? branch : `${branch}:${targetBranch}`;
          // Hitung commit yang benar-benar belum ada di remote SEBELUM push.
          // Kalau 0, push tidak akan mengirim apa pun meskipun exit code 0.
          const aheadRes = await run(['rev-list', '--count', `${remoteName}/${targetBranch}..HEAD`], { cwd });
          const aheadCount = aheadRes.code === 0 ? Number(aheadRes.stdout.trim()) : NaN;
          res = await run(['push', ...(setUpstream ? ['-u'] : []), ...forceArgs, remoteName, refspec], { cwd });
          entry.from = { label: `Lokal · ${branch} @ ${info.head}`, path: cwd, branch, sha: info.head };
          entry.to = { label: `${remoteName}/${targetBranch} · ${remote.pushUrl}`, url: remote.pushUrl, branch: targetBranch, remote: remoteName, webUrl: branchesUrl(remote.pushUrl) };
          // ahead = 0 berarti tidak ada commit lokal yang belum ada di upstream.
          // Teks "Everything up-to-date" tidak selalu muncul (mis. remote file://),
          // jadi jangan bergantung pada output saja.
          const nothingToPush = aheadCount === 0
            || /everything up-to-date|up-to-date/i.test(String(outputOf(res) || ''));
          entry.meta = { setUpstream, force: Boolean(params.force), refspec, noChanges: nothingToPush };
          if (nothingToPush) {
            entry.summary = 'Tidak ada commit baru untuk dikirim — remote sudah up-to-date. Commit dulu perubahan lokalnya.';
          }
          break;
        }
        case 'commit': {
          const message = String(params.message || '').trim();
          if (!message) throw new HttpError(400, 'Pesan commit wajib diisi.');
          const addRes = await run(['add', '-A'], { cwd });
          const authorArgs = cfg.git.authorFromAccount && account
            ? ['-c', `user.name=${account.name || account.login}`, '-c', `user.email=${account.email}`]
            : [];
          res = await run([...authorArgs, 'commit', '-m', message], { cwd });
          const headRes = await run(['rev-parse', '--short', 'HEAD'], { cwd });
          const noChanges = /nothing to commit|no changes added/i.test(res.stdout + res.stderr);
          entry.from = { label: `Working tree · ${info.dirty.total} perubahan`, path: cwd, branch: info.branch, sha: info.head };
          entry.to = { label: `Lokal · ${branch} @ ${headRes.stdout.trim() || info.head}`, path: cwd, branch, sha: headRes.stdout.trim() || info.head };
          entry.meta = { author: account?.email || null, message, files: info.dirty.total };
          entry.command = [addRes.command, res.command].join(' && ');
          entry.exitCode = noChanges ? 0 : res.code;
          result = { ok: res.code === 0 || noChanges, code: res.code, output: outputOf(addRes, res) };
          break;
        }
        case 'checkout': {
          const target = assertRef(params.target, 'branch');
          res = await run(['checkout', target], { cwd });
          entry.from = { label: info.branch, path: cwd, branch: info.branch, sha: info.head };
          entry.to = { label: target, path: cwd, branch: target };
          break;
        }
        case 'branch': {
          const raw = String(params.newBranch || '').trim();
          const prefix = cfg.arena.enabled && params.useArenaPrefix ? cfg.arena.branchPrefix : '';
          const target = assertRef(prefix && !raw.startsWith(prefix) ? prefix + raw : raw, 'branch baru');
          res = await run(['checkout', '-b', target], { cwd });
          entry.from = { label: `${info.branch} @ ${info.head}`, path: cwd, branch: info.branch, sha: info.head };
          entry.to = { label: target, path: cwd, branch: target };
          break;
        }
        case 'remote': {
          const mode = ['add', 'set-url', 'remove'].includes(params.mode) ? params.mode : 'add';
          const url = mode === 'remove' ? '' : assertUrl(params.url);
          const existing = info.remotes.find((r) => r.name === remoteName);
          res = mode === 'remove'
            ? await run(['remote', 'remove', remoteName], { cwd })
            : await run(['remote', mode === 'set-url' || existing ? 'set-url' : 'add', remoteName, url], { cwd });
          entry.from = { label: existing?.pushUrl || '(belum ada remote)', url: existing?.pushUrl || '' };
          entry.to = { label: mode === 'remove' ? '(remote dihapus)' : url, url, remote: remoteName };
          break;
        }
        default:
          throw new HttpError(400, `Aksi Git tidak dikenal: ${action}`);
      }

      if (action !== 'commit') {
        entry.command = res.command;
        entry.exitCode = res.code;
        result = { ok: res.code === 0, code: res.code, output: outputOf(res) };
      }
      if (!entry.summary) entry.summary = describe(action, entry, result.code);

      // Git keluar 0 dengan "Everything up-to-date" kalau tidak ada commit baru.
      // Tanpa penanda ini pengguna mengira push berhasil mengirim perubahan.
      if (action !== 'push' && /everything up-to-date|up-to-date|tidak ada perubahan/i.test(String(result.output || ''))) {
        entry.meta = { ...(entry.meta || {}), noChanges: true };
        if (action === 'pull') entry.summary = 'Sudah up-to-date, tidak ada commit baru yang ditarik.';
      }
    }

    entry.success = Boolean(result.ok);
    entry.output = truncate(result.output || '(tanpa output)', 12000);
    entry.durationMs = Date.now() - start;
    bus('end', { opId, action, success: entry.success, durationMs: entry.durationMs });
    return { entry, result: { ...result, repo: entry.repo, from: entry.from, to: entry.to, opId } };
  } catch (error) {
    entry.success = false;
    entry.exitCode = -1;
    entry.output = error.message;
    entry.summary = error.message;
    entry.durationMs = Date.now() - start;
    bus('end', { opId, action, success: false, durationMs: entry.durationMs, error: error.message });
    if (error instanceof HttpError) throw error;
    return { entry, result: { ok: false, code: -1, output: error.message } };
  }
}

function describe(action, entry, code) {
  if (code !== 0) return `Gagal: ${action}`;
  const map = {
    status: 'Cek status',
    fetch: `Fetch dari ${entry.from?.label || 'remote'}`,
    pull: `Pull ${entry.from?.branch || ''} → ${entry.to?.branch || ''}`,
    push: `Push ${entry.from?.branch || ''} → ${entry.to?.label || ''}`,
    commit: `Commit ke ${entry.to?.label || ''}`,
    checkout: `Pindah ${entry.from?.label} → ${entry.to?.label}`,
    branch: `Branch baru ${entry.to?.label}`,
    remote: `Remote → ${entry.to?.label}`,
    clone: `Clone → ${entry.to?.label}`,
    init: `Init repo → ${entry.to?.label}`,
  };
  return map[action] || action;
}

/** Konteks siap salin untuk dipakai di Arena AI. */
export function arenaContext(cfg, info, account) {
  const remote = info?.remotes?.[0];
  const lines = [
    `Project: ${info?.name || path.basename(PROJECT_ROOT)}`,
    `Path lokal: ${info?.path || PROJECT_ROOT}`,
    `Branch: ${info?.branch || '-'}${info?.upstream ? ` (upstream ${info.upstream})` : ''}`,
    `Remote ${remote?.name || 'origin'} push: ${remote?.pushUrl || '(belum ada)'}`,
    `Remote ${remote?.name || 'origin'} fetch: ${remote?.fetchUrl || '(belum ada)'}`,
    `HEAD: ${info?.head || '-'} · ${info?.ahead || 0} ahead / ${info?.behind || 0} behind`,
    `Perubahan: ${info?.dirty?.total || 0} file`,
    `Akun GitHub aktif: ${account?.login || '-'} <${account?.email || '-'}>`,
    `Catatan: ${cfg.arena.contextNote}`,
  ];
  return {
    label: cfg.arena.sessionLabel,
    text: `${lines.join('\n')}\n\n${cfg.arena.contextNote}`,
    lines,
  };
}
