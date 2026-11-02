'use strict';

import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const now = () => new Date().toISOString();
export const uid = (prefix = '') => prefix + crypto.randomBytes(8).toString('hex');
export const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
export const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString('base64url');

export function safeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

export function hmac(secret, value) {
  return crypto.createHmac('sha256', secret).update(value).digest('base64url');
}

export function getPath(obj, dotted) {
  return dotted.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

export function setPath(obj, dotted, value) {
  const keys = dotted.split('.');
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i += 1) {
    if (typeof cur[keys[i]] !== 'object' || cur[keys[i]] === null || Array.isArray(cur[keys[i]])) {
      cur[keys[i]] = {};
    }
    cur = cur[keys[i]];
  }
  cur[keys.at(-1)] = value;
  return obj;
}

export function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function truncate(value, max = 20000) {
  const str = String(value ?? '');
  return str.length > max ? str.slice(0, max) + `\n… [terpotong ${str.length - max} karakter]` : str;
}

export function redact(value, secrets = []) {
  let str = String(value ?? '');
  for (const secret of secrets) {
    if (secret && secret.length > 3) str = str.split(secret).join('***');
  }
  return str;
}

export function readJsonSync(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

export async function writeJsonAtomic(file, value) {
  await fsp.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  await fsp.writeFile(tmp, JSON.stringify(value, null, 2) + '\n', { mode: 0o600 });
  await fsp.rename(tmp, file);
  await fsp.chmod(file, 0o600).catch(() => {});
}

export function json(res, status, body, headers = {}) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    'Cache-Control': 'no-store',
    ...headers,
  });
  res.end(payload);
}

export const ok = (res, body = {}) => json(res, 200, { ok: true, ...body });
export const fail = (res, err) => {
  const status = err instanceof HttpError ? err.status : 500;
  const message = err?.message || 'Terjadi kesalahan internal';
  if (status >= 500) console.error('[api]', err);
  return json(res, status, { ok: false, error: message, details: err?.details });
};

/** Baca body JSON dengan batas ukuran (1 MB). */
export async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 1024 * 1024) throw new HttpError(413, 'Body terlalu besar (maks 1 MB)');
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  const raw = Buffer.concat(chunks).toString('utf8');
  try {
    return JSON.parse(raw);
  } catch {
    throw new HttpError(400, 'Body harus berupa JSON yang valid');
  }
}

export function parseCookies(header = '') {
  const out = {};
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx < 0) continue;
    const key = part.slice(0, idx).trim();
    if (key) out[key] = decodeURIComponent(part.slice(idx + 1).trim());
  }
  return out;
}

export class EventBus {
  constructor() {
    this.clients = new Set();
  }

  subscribe(res, initial) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.write(`event: ready\ndata: ${JSON.stringify(initial)}\n\n`);
    this.clients.add(res);
    const keepAlive = setInterval(() => {
      try { res.write(': ping\n\n'); } catch { /* closed */ }
    }, 20000);
    const cleanup = () => {
      clearInterval(keepAlive);
      this.clients.delete(res);
    };
    res.on('close', cleanup);
    res.on('error', cleanup);
    return cleanup;
  }

  emit(type, payload) {
    const data = `event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`;
    for (const res of this.clients) {
      try { res.write(data); } catch { this.clients.delete(res); }
    }
  }
}

/** Konkurensi sederhana untuk pemindaian banyak repo. */
export async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      try {
        results[index] = { ok: true, value: await fn(items[index], index) };
      } catch (error) {
        results[index] = { ok: false, error: error.message };
      }
    }
  });
  await Promise.all(workers);
  return results;
}
