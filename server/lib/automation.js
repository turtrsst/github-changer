'use strict';

/**
 * Mesin automasi:
 * - scheduler berkala (fetch/pull/push) untuk repo tertentu,
 * - webhook GitHub (signature HMAC-SHA256) → sync + perintah deploy,
 * - semua run tercatat di activity.jsonl dengan `trigger` (schedule/webhook/manual).
 * Tidak butuh sesi browser: memakai akun GitHub yang tersimpan (terenkripsi).
 */
import crypto from 'node:crypto';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { loadConfig } from './config.js';
import { accounts, activity } from './store.js';
import * as git from './git.js';
import { now, safeEqual, truncate } from './util.js';

const state = {
  enabled: false,
  running: false,
  schedulerStartedAt: Date.now(),
  lastRunAt: null,
  lastTrigger: null,
  lastResult: null,
  nextRunAt: null,
  runs: [],
  timer: null,
  bus: null,
};

export function automationStatus() {
  const { timer, bus, ...safe } = state;
  return { ...safe, runs: state.runs.slice(-50) };
}

export function verifySignature(secret, raw, header) {
  if (!secret || !header) return false;
  const expected = `sha256=${crypto.createHmac('sha256', secret).update(raw).digest('hex')}`;
  return safeEqual(String(header), expected);
}

function pickAccount(cfg) {
  const all = accounts.list();
  if (!all.length) return null;
  const wanted = cfg.automation.accountId;
  return all.find((a) => a.id === wanted) || all[0];
}

/** Cocokkan payload push GitHub ke repo lokal lewat URL remote / full_name. */
export async function matchRepos(cfg, payload) {
  const fullName = String(payload?.repository?.full_name || '').toLowerCase();
  const cloneUrl = String(payload?.repository?.clone_url || '').toLowerCase();
  const repos = await git.scanWithInfo(cfg);
  const matched = repos.filter((repo) => (repo.remotes || []).some((remote) => {
    const urls = [remote.pushUrl, remote.fetchUrl].map((u) => String(u || '').toLowerCase());
    return (fullName && urls.some((u) => u.includes(fullName))) || (cloneUrl && urls.includes(cloneUrl));
  })).map((repo) => repo.path);
  if (matched.length) return matched;
  return (cfg.automation.repos || []).filter(Boolean);
}

/** Perintah deploy TANPA shell: argumen dipisah spasi, tidak ada && | ; $( ). */
export function runDeployCommand(cfg, repoPath) {
  const raw = String(cfg.automation.deployCommand || '').trim();
  if (!raw) return Promise.resolve(null);
  const parts = raw.split(/\s+/);
  let bin = parts[0];
  const args = parts.slice(1);
  if (process.platform === 'win32' && !/\.(exe|cmd|bat)$/i.test(bin)) bin += '.cmd';
  const resolved = git.findOnPath(bin) || bin;
  return new Promise((resolve) => {
    let child;
    try {
      child = spawn(resolved, args, { cwd: repoPath, shell: false, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (error) {
      resolve({ ok: false, command: raw, output: error.message });
      return;
    }
    let output = '';
    const timer = setTimeout(() => { try { child.kill(); } catch { /* ignore */ } }, 120000);
    child.stdout.on('data', (c) => { output += c.toString('utf8'); });
    child.stderr.on('data', (c) => { output += c.toString('utf8'); });
    child.on('error', (e) => { output += `\n${e.message}`; });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ ok: code === 0, code, command: raw, output: truncate(output, 8000) });
    });
  });
}

export async function runAutomation({ trigger = 'manual', action, repoPaths, bus } = {}) {
  if (state.running) return { skipped: true, reason: 'Masih ada proses automasi yang berjalan' };
  const cfg = loadConfig();
  const account = pickAccount(cfg);
  const token = account ? accounts.token(account.id) : null;
  if (!account || !token) return { skipped: true, reason: 'Belum ada akun GitHub yang login / token tidak bisa dibaca' };

  const op = action || cfg.automation.action || 'pull';
  if (!['fetch', 'pull', 'push'].includes(op)) return { skipped: true, reason: `Aksi automasi tidak valid: ${op}` };

  state.running = true;
  const startedAt = now();
  const result = { trigger, action: op, startedAt, account: account.email, repos: [], ok: 0, failed: 0, skipped: 0 };
  const emit = (type, payload) => { if (bus) bus.emit('automation', { type, ...payload }); };
  emit('start', { trigger, action: op, account: account.email });

  try {
    let paths = await git.scanRepos(cfg);
    if (Array.isArray(repoPaths) && repoPaths.length) {
      paths = paths.filter((p) => repoPaths.some((r) => p === r || p.toLowerCase() === String(r).toLowerCase()));
    } else if (cfg.automation.repos?.length) {
      paths = paths.filter((p) => cfg.automation.repos.some((r) => p.toLowerCase() === String(r).toLowerCase()));
    }
    for (const repoPath of paths.slice(0, cfg.workspace.maxRepos || 200)) {
      let info = null;
      try { info = await git.repoInfo(cfg, repoPath); } catch { /* repo tidak bisa dibaca */ }
      if (cfg.automation.onlyClean && op !== 'fetch' && info?.dirty?.total > 0) {
        result.skipped += 1;
        result.repos.push({ path: repoPath, name: path.basename(repoPath), result: 'skipped', reason: 'ada perubahan lokal' });
        continue;
      }
      // Pengaman: jangan pernah pull branch yang salah (mis. server nggak sengaja
      // checkout main padahal domain menjalankan branch arena/*).
      const expectedBranch = String(cfg.automation.branch || '').trim();
      if (expectedBranch && op !== 'fetch' && info?.branch && info.branch !== expectedBranch) {
        result.skipped += 1;
        result.repos.push({
          path: repoPath, name: path.basename(repoPath), result: 'skipped',
          reason: `branch ${info.branch} ≠ ${expectedBranch} (automation.branch)`,
        });
        continue;
      }
      const { entry } = await git.runOperation(cfg, { account, token, onOutput: null }, op, { path: repoPath });
      await activity.append({ ...entry, trigger });
      if (entry.success) result.ok += 1; else result.failed += 1;
      result.repos.push({ path: repoPath, name: path.basename(repoPath), result: entry.success ? 'ok' : 'failed', summary: entry.summary });
      emit('repo', { path: repoPath, success: entry.success, summary: entry.summary });
    }
    await activity.trim(cfg.activity.retention || 1000);
  } catch (error) {
    result.error = error.message;
  } finally {
    state.running = false;
    result.finishedAt = now();
    state.lastRunAt = startedAt;
    state.lastTrigger = trigger;
    state.lastResult = result;
    state.runs.push(result);
    if (state.runs.length > 50) state.runs.shift();
    emit('end', result);
  }
  return result;
}

export function startScheduler(bus) {
  state.bus = bus;
  state.schedulerStartedAt = Date.now();
  if (state.timer) clearInterval(state.timer);

  const tick = () => {
    const cfg = loadConfig();
    state.enabled = Boolean(cfg.automation.enabled);
    const intervalMs = Math.max(1, Number(cfg.automation.intervalMinutes) || 15) * 60000;
    const base = state.lastRunAt ? new Date(state.lastRunAt).getTime() : state.schedulerStartedAt;
    state.nextRunAt = new Date(base + intervalMs).toISOString();
    if (!state.enabled || state.running) return;
    if (Date.now() >= base + intervalMs) {
      runAutomation({ trigger: 'schedule', bus }).catch(() => {});
    }
  };

  state.timer = setInterval(tick, 60000);
  tick();
  return state.timer;
}

export function stopScheduler() {
  if (state.timer) clearInterval(state.timer);
  state.timer = null;
}
