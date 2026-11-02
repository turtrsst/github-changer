'use strict';

/**
 * Penyimpanan lokal: akun GitHub (token terenkripsi AES-256-GCM), sesi,
 * dan riwayat aktivitas Git (JSONL). Semua file berada di data/ yang di-gitignore.
 */
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { DATA_DIR } from './config.js';
import { now, randomToken, readJsonSync, sha256, uid, writeJsonAtomic } from './util.js';

const ACCOUNTS_FILE = path.join(DATA_DIR, 'accounts.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const SECRET_FILE = path.join(DATA_DIR, 'secret.key');
const ACTIVITY_FILE = path.join(DATA_DIR, 'activity.jsonl');

let cachedKey;

function encryptionKey() {
  if (cachedKey) return cachedKey;
  if (process.env.APP_SECRET) {
    cachedKey = crypto.createHash('sha256').update(process.env.APP_SECRET).digest();
  } else {
    if (!fs.existsSync(SECRET_FILE)) {
      fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
      fs.writeFileSync(SECRET_FILE, crypto.randomBytes(32), { mode: 0o600 });
    }
    cachedKey = fs.readFileSync(SECRET_FILE);
  }
  return cachedKey;
}

function encrypt(text) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const data = Buffer.concat([cipher.update(String(text), 'utf8'), cipher.final()]);
  return { iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), data: data.toString('base64') };
}

function decrypt(payload) {
  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(payload.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(payload.tag, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(payload.data, 'base64')), decipher.final()]).toString('utf8');
}

function readAccounts() {
  return readJsonSync(ACCOUNTS_FILE, { accounts: [] }).accounts || [];
}

async function writeAccounts(accounts) {
  await writeJsonAtomic(ACCOUNTS_FILE, { accounts });
}

export function publicAccount(account) {
  if (!account) return null;
  const { id, githubId, login, email, name, avatarUrl, scopes, kind, createdAt, lastUsedAt, htmlUrl } = account;
  return { id, githubId, login, email, name, avatarUrl, scopes, kind, createdAt, lastUsedAt, htmlUrl };
}

export const accounts = {
  list: () => readAccounts().map(publicAccount),
  count: () => readAccounts().length,
  raw: (id) => readAccounts().find((a) => a.id === id) || null,
  get: (id) => publicAccount(readAccounts().find((a) => a.id === id)),

  token(id) {
    const account = readAccounts().find((a) => a.id === id);
    if (!account) return null;
    try { return decrypt(account.tokenEnc); } catch { return null; }
  },

  /** Upsert berdasarkan githubId supaya login ulang tidak menggandakan akun. */
  async upsert({ githubId, login, email, name, avatarUrl, htmlUrl, scopes, token, kind = 'oauth' }) {
    const all = readAccounts();
    const existing = all.find((a) => String(a.githubId) === String(githubId));
    const record = {
      id: existing?.id || uid('acc_'),
      githubId: String(githubId),
      login,
      email,
      name: name || login,
      avatarUrl: avatarUrl || '',
      htmlUrl: htmlUrl || `https://github.com/${login}`,
      scopes: scopes || '',
      kind,
      tokenEnc: encrypt(token),
      createdAt: existing?.createdAt || now(),
      lastUsedAt: now(),
    };
    if (existing) Object.assign(existing, record);
    else all.push(record);
    await writeAccounts(all);
    return publicAccount(record);
  },

  async touch(id) {
    const all = readAccounts();
    const account = all.find((a) => a.id === id);
    if (account) {
      account.lastUsedAt = now();
      await writeAccounts(all);
    }
  },

  async remove(id) {
    const all = readAccounts();
    const next = all.filter((a) => a.id !== id);
    await writeAccounts(next);
    const sessions = readJsonSync(SESSIONS_FILE, { sessions: {} });
    for (const [hash, value] of Object.entries(sessions.sessions || {})) {
      if (value.accountId === id) delete sessions.sessions[hash];
    }
    await writeJsonAtomic(SESSIONS_FILE, sessions);
    return next.length !== all.length;
  },
};

export const sessions = {
  async create(accountId, days = 7) {
    const token = randomToken();
    const file = readJsonSync(SESSIONS_FILE, { sessions: {} });
    file.sessions = file.sessions || {};
    file.sessions[sha256(token)] = {
      accountId,
      createdAt: now(),
      expiresAt: new Date(Date.now() + days * 86400_000).toISOString(),
    };
    await writeJsonAtomic(SESSIONS_FILE, file);
    await accounts.touch(accountId);
    return token;
  },

  resolve(token) {
    if (!token) return null;
    const file = readJsonSync(SESSIONS_FILE, { sessions: {} });
    const session = (file.sessions || {})[sha256(token)];
    if (!session) return null;
    if (new Date(session.expiresAt).getTime() < Date.now()) return null;
    if (!accounts.raw(session.accountId)) return null;
    return session;
  },

  async setAccount(token, accountId) {
    const file = readJsonSync(SESSIONS_FILE, { sessions: {} });
    const key = sha256(token);
    if (!file.sessions?.[key]) return false;
    file.sessions[key].accountId = accountId;
    await writeJsonAtomic(SESSIONS_FILE, file);
    await accounts.touch(accountId);
    return true;
  },

  async destroy(token) {
    const file = readJsonSync(SESSIONS_FILE, { sessions: {} });
    const key = sha256(token);
    if (file.sessions?.[key]) {
      delete file.sessions[key];
      await writeJsonAtomic(SESSIONS_FILE, file);
      return true;
    }
    return false;
  },

  async purge() {
    const file = readJsonSync(SESSIONS_FILE, { sessions: {} });
    let changed = false;
    for (const [hash, value] of Object.entries(file.sessions || {})) {
      if (new Date(value.expiresAt).getTime() < Date.now()) {
        delete file.sessions[hash];
        changed = true;
      }
    }
    if (changed) await writeJsonAtomic(SESSIONS_FILE, file);
  },
};

export const activity = {
  async append(entry) {
    await fsp.mkdir(DATA_DIR, { recursive: true });
    const record = { id: uid('log_'), ts: now(), ...entry };
    await fsp.appendFile(ACTIVITY_FILE, JSON.stringify(record) + '\n', { mode: 0o600 });
    return record;
  },

  async list({ limit = 200, op, accountId, repo, since } = {}) {
    let raw = '';
    try { raw = await fsp.readFile(ACTIVITY_FILE, 'utf8'); } catch { return []; }
    let entries = raw.split('\n').filter(Boolean).flatMap((line) => {
      try { return [JSON.parse(line)]; } catch { return []; }
    });
    if (op) entries = entries.filter((e) => e.op === op);
    if (accountId) entries = entries.filter((e) => e.accountId === accountId);
    if (repo) entries = entries.filter((e) => (e.repo?.name || '').toLowerCase().includes(repo.toLowerCase()));
    if (since) entries = entries.filter((e) => new Date(e.ts).getTime() >= Number(since));
    return entries.slice(-Math.min(Math.max(limit, 1), 5000)).reverse();
  },

  async stats() {
    const entries = await this.list({ limit: 5000 });
    const pushes = entries.filter((e) => e.op === 'push' && e.success);
    const pulls = entries.filter((e) => (e.op === 'pull' || e.op === 'fetch' || e.op === 'clone') && e.success);
    const group = (items, keyFn) => {
      const map = new Map();
      for (const item of items) {
        const key = keyFn(item) || 'tidak diketahui';
        const prev = map.get(key) || { key, count: 0, lastTs: item.ts, branches: new Set(), accounts: new Set() };
        prev.count += 1;
        if (item.ts > prev.lastTs) prev.lastTs = item.ts;
        if (item.to?.branch) prev.branches.add(item.to.branch);
        if (item.from?.branch) prev.branches.add(item.from.branch);
        if (item.email) prev.accounts.add(item.email);
        map.set(key, prev);
      }
      return [...map.values()]
        .map((v) => ({ ...v, branches: [...v.branches], accounts: [...v.accounts] }))
        .sort((a, b) => b.count - a.count);
    };
    return {
      total: entries.length,
      success: entries.filter((e) => e.success).length,
      failed: entries.filter((e) => !e.success).length,
      pushes: pushes.length,
      pulls: pulls.length,
      destinations: group(pushes, (e) => e.to?.url || e.to?.label),
      origins: group(pulls, (e) => e.from?.url || e.from?.label),
      accounts: group(entries, (e) => e.email || e.login),
      byOp: Object.entries(entries.reduce((acc, e) => ({ ...acc, [e.op]: (acc[e.op] || 0) + 1 }), {}))
        .map(([op, count]) => ({ op, count })).sort((a, b) => b.count - a.count),
    };
  },

  async clear() {
    await fsp.writeFile(ACTIVITY_FILE, '', { mode: 0o600 });
  },

  async trim(retention = 1000) {
    const entries = await this.list({ limit: 100000 });
    if (entries.length <= retention) return;
    const kept = entries.slice(0, retention).reverse();
    await fsp.writeFile(ACTIVITY_FILE, kept.map((e) => JSON.stringify(e)).join('\n') + '\n', { mode: 0o600 });
  },
};

export const paths = { ACCOUNTS_FILE, SESSIONS_FILE, SECRET_FILE, ACTIVITY_FILE };
