'use strict';

/** Sesi aplikasi + state machine OAuth Device Flow. */
import { accounts, sessions } from './store.js';
import * as github from './github.js';
import { HttpError, hmac, parseCookies, safeEqual, uid, randomToken } from './util.js';

const COOKIE = 'ghc_session';
const flows = new Map();

export function authContext(req, url) {
  const header = req.headers.authorization || '';
  const bearer = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  const cookie = parseCookies(req.headers.cookie || '')[COOKIE];
  const queryToken = url.searchParams.get('token');
  const sessionToken = bearer || queryToken || cookie || '';
  const session = sessions.resolve(sessionToken);
  const account = session ? accounts.get(session.accountId) : null;
  const pin = process.env.APP_PIN || '';
  const suppliedPin = req.headers['x-app-pin'] || url.searchParams.get('pin') || '';
  const pinRequired = Boolean(pin);
  const pinOk = !pinRequired || safeEqual(pin, suppliedPin);
  return { sessionToken, session, account, authenticated: Boolean(account), pinRequired, pinOk };
}

export function requireAuth(ctx) {
  if (!ctx.authenticated) throw new HttpError(401, 'Belum login. Masuk dengan akun GitHub dulu.');
  return ctx.account;
}

export function requirePin(ctx) {
  if (ctx.pinRequired && !ctx.pinOk) {
    const error = new HttpError(401, 'PIN aplikasi diperlukan.');
    error.details = { code: 'PIN_REQUIRED' };
    throw error;
  }
}

export function sessionCookie(token, days = 7) {
  const maxAge = days * 86400;
  return `${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
}

export function clearCookie() {
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

/**
 * CSRF ringan yang tetap bekerja di belakang reverse proxy / preview:
 * - mutasi wajib JSON (form lintas situs tidak bisa mengirim application/json tanpa preflight),
 * - tolak eksplisit permintaan yang ditandai browser sebagai cross-site,
 * - autorisasi tetap membutuhkan Bearer token (cookie fallback SameSite=Lax).
 * Membandingkan header Host secara ketat justru bisa memutus preview yang rewrite Host,
 * jadi tidak dipakai di sini.
 */
export function assertSameOrigin(req) {
  const site = req.headers['sec-fetch-site'];
  if (site === 'cross-site') throw new HttpError(403, 'Permintaan lintas situs ditolak');
}

function checkAllowlist(cfg, identity) {
  const list = cfg.auth.allowedEmails || [];
  if (!list.length) return;
  const candidates = [identity.email, identity.login].map((v) => String(v || '').toLowerCase());
  if (!list.some((entry) => candidates.includes(String(entry).toLowerCase()))) {
    throw new HttpError(403, `Akun ${identity.email} tidak ada dalam daftar email yang diizinkan. Ubah parameter auth.allowedEmails.`);
  }
}

async function finishLogin(cfg, identity, token, kind, flow) {
  checkAllowlist(cfg, identity);
  const account = await accounts.upsert({ ...identity, token, kind, scopes: flow?.scopes || '' });
  const sessionToken = await sessions.create(account.id, cfg.auth.sessionDays);
  return { account, sessionToken };
}

export async function startDeviceFlow(cfg) {
  const info = await github.startDeviceFlow(cfg.auth.clientId, cfg.auth.scopes);
  const id = uid('flow_');
  flows.set(id, {
    id,
    clientId: cfg.auth.clientId,
    deviceCode: info.deviceCode,
    interval: info.interval,
    expiresAt: Date.now() + info.expiresIn * 1000,
    lastPoll: 0,
    status: 'pending',
    result: null,
    error: null,
  });
  return {
    flowId: id,
    userCode: info.userCode,
    verificationUri: info.verificationUri,
    expiresIn: info.expiresIn,
    interval: info.interval,
  };
}

export async function pollDeviceFlow(cfg, flowId) {
  const flow = flows.get(flowId);
  if (!flow) throw new HttpError(404, 'Sesi login tidak ditemukan atau sudah kedaluwarsa. Mulai ulang.');
  if (flow.status === 'success') return { status: 'success', ...flow.result };
  if (flow.status !== 'pending') return { status: flow.status, message: flow.error };
  if (Date.now() > flow.expiresAt) {
    flow.status = 'expired';
    flow.error = 'Kode login kedaluwarsa. Mulai ulang proses login.';
    return { status: 'expired', message: flow.error };
  }
  if (Date.now() - flow.lastPoll < flow.interval * 1000) return { status: 'pending', retryIn: Math.ceil((flow.interval * 1000 - (Date.now() - flow.lastPoll)) / 1000) };
  flow.lastPoll = Date.now();

  const result = await github.pollDeviceFlow(flow.clientId, flow.deviceCode);
  if (result.status === 'slow_down') {
    flow.interval += 5;
    return { status: 'pending', retryIn: flow.interval };
  }
  if (result.status !== 'success') {
    if (['expired', 'denied', 'error'].includes(result.status)) {
      flow.status = result.status;
      flow.error = result.message || 'Login gagal';
      flows.delete(flowId);
    }
    return { status: result.status, message: result.message };
  }

  try {
    const identity = await github.fetchIdentity(result.token);
    const login = await finishLogin(cfg, identity, result.token, 'oauth', result);
    flow.status = 'success';
    flow.result = login;
    // device_code tidak dipakai lagi; hapus setelah 1 menit.
    setTimeout(() => flows.delete(flowId), 60_000).unref?.();
    return { status: 'success', ...login };
  } catch (error) {
    flows.delete(flowId);
    throw error;
  }
}

export async function cancelDeviceFlow(flowId) {
  flows.delete(flowId);
  return { cancelled: true };
}

export async function loginWithPat(cfg, token) {
  if (!cfg.auth.allowPat) throw new HttpError(403, 'Login dengan token manual dinonaktifkan di parameter auth.allowPat.');
  const clean = String(token || '').trim();
  if (!clean) throw new HttpError(400, 'Token tidak boleh kosong.');
  const identity = await github.fetchIdentity(clean);
  return finishLogin(cfg, identity, clean, 'pat', { scopes: 'manual-pat' });
}

export async function logout(ctx) {
  if (ctx.sessionToken) await sessions.destroy(ctx.sessionToken);
  return { loggedOut: true };
}

export async function switchAccount(ctx, cfg, accountId) {
  requireAuth(ctx);
  const target = accounts.get(accountId);
  if (!target) throw new HttpError(404, 'Akun tidak ditemukan.');
  if (!ctx.sessionToken) {
    return { account: target, sessionToken: await sessions.create(target.id, cfg.auth.sessionDays) };
  }
  await sessions.setAccount(ctx.sessionToken, target.id);
  return { account: target, sessionToken: ctx.sessionToken };
}

/** Token CSRF ringan untuk SSE / tautan internal (bukan rahasia, hanya penanda). */
export function csrfTag(secret) {
  return hmac(secret, randomToken(8));
}
