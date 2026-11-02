'use strict';

/** Klien GitHub: OAuth 2.0 Device Flow + REST API v3. Tanpa dependency eksternal. */
import { HttpError } from './util.js';

const API_BASE = 'https://api.github.com';
const DEVICE_CODE_URL = 'https://github.com/login/device/code';
const ACCESS_TOKEN_URL = 'https://github.com/login/oauth/access_token';

const JSON_HEADERS = {
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'github-changer-local-app',
};

async function parseResponse(response) {
  const text = await response.text();
  const type = response.headers.get('content-type') || '';
  if (type.includes('application/json')) {
    try { return JSON.parse(text); } catch { return {}; }
  }
  try {
    return Object.fromEntries(new URLSearchParams(text));
  } catch {
    return { raw: text };
  }
}

async function request(url, { method = 'GET', headers = {}, body, timeoutMs = 20000 } = {}) {
  let response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body,
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    throw new HttpError(502, `Tidak bisa menghubungi GitHub: ${error.message}. Cek koneksi internet server.`);
  }
  const data = await parseResponse(response);
  return { response, data };
}

/** Langkah 1 Device Flow: minta kode yang ditunjukkan ke user. */
export async function startDeviceFlow(clientId, scopes) {
  if (!clientId) {
    throw new HttpError(400, 'OAuth Client ID belum diisi. Buka halaman Parameters → Otentikasi GitHub, atau set GITHUB_CLIENT_ID di .env.');
  }
  const { response, data } = await request(DEVICE_CODE_URL, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'github-changer-local-app' },
    body: new URLSearchParams({ client_id: clientId, scope: scopes }),
  });
  if (!response.ok || !data.device_code) {
    const hint = data.error === 'invalid_client_id' || response.status === 404
      ? ' Client ID tidak dikenal GitHub. Pastikan OAuth App sudah dibuat dan Device Flow diaktifkan.'
      : '';
    throw new HttpError(400, `GitHub menolak permintaan Device Flow (${data.error || response.status}).${hint}`);
  }
  return {
    deviceCode: data.device_code,
    userCode: data.user_code,
    verificationUri: data.verification_uri || 'https://github.com/login/device',
    expiresIn: Number(data.expires_in) || 900,
    interval: Math.max(Number(data.interval) || 5, 5),
  };
}

/** Langkah 2 Device Flow: polling sampai user selesai approve di github.com/login/device. */
export async function pollDeviceFlow(clientId, deviceCode) {
  const { data } = await request(ACCESS_TOKEN_URL, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'github-changer-local-app' },
    body: new URLSearchParams({
      client_id: clientId,
      device_code: deviceCode,
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
    }),
  });
  if (data.access_token) {
    return { status: 'success', token: data.access_token, scopes: data.scope || '' };
  }
  switch (data.error) {
    case 'authorization_pending': return { status: 'pending' };
    case 'slow_down': return { status: 'slow_down' };
    case 'expired_token': return { status: 'expired', message: 'Kode login kedaluwarsa. Mulai ulang proses login.' };
    case 'access_denied': return { status: 'denied', message: 'Login dibatalkan di halaman GitHub.' };
    case 'incorrect_device_code': return { status: 'expired', message: 'Kode perangkat tidak valid. Mulai ulang proses login.' };
    default: return { status: 'error', message: data.error_description || data.error || 'Respons GitHub tidak dikenal' };
  }
}

export async function apiRequest(pathname, { token, method = 'GET', body, timeoutMs = 25000 } = {}) {
  if (!token) throw new HttpError(401, 'Token GitHub tidak tersedia. Login ulang.');
  const { response, data } = await request(`${API_BASE}${pathname}`, {
    method,
    headers: {
      ...JSON_HEADERS,
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    timeoutMs,
  });
  if (!response.ok) {
    const message = data?.message || `GitHub API error ${response.status}`;
    const extra = response.status === 401 ? ' (token mungkin sudah dicabut — login ulang)' : '';
    throw new HttpError(response.status === 401 ? 401 : 400, `${message}${extra}`);
  }
  return {
    data,
    rate: {
      limit: response.headers.get('x-ratelimit-limit'),
      remaining: response.headers.get('x-ratelimit-remaining'),
      reset: response.headers.get('x-ratelimit-reset'),
    },
  };
}

/** Identitas asli akun: profil + email utama yang terverifikasi. */
export async function fetchIdentity(token) {
  const { data: user } = await apiRequest('/user', { token });
  let email = user.email || '';
  try {
    const { data: emails } = await apiRequest('/user/emails', { token });
    if (Array.isArray(emails)) {
      const primary = emails.find((e) => e.primary && e.verified) || emails.find((e) => e.verified);
      if (primary?.email) email = primary.email;
    }
  } catch { /* scope user:email opsional; fallback ke user.email / noreply */ }
  if (!email) email = `${user.id}+${user.login}@users.noreply.github.com`;
  return {
    githubId: String(user.id),
    login: user.login,
    name: user.name || user.login,
    email,
    avatarUrl: user.avatar_url || '',
    htmlUrl: user.html_url || `https://github.com/${user.login}`,
    plan: user.plan?.name || '',
  };
}

export async function listRepos(token, { page = 1, perPage = 100, sort = 'updated' } = {}) {
  const query = new URLSearchParams({
    per_page: String(perPage), page: String(page), sort,
    affiliation: 'owner,collaborator,organization_member',
  });
  return apiRequest(`/user/repos?${query}`, { token });
}

export async function createRepo(token, payload) {
  return apiRequest('/user/repos', { token, method: 'POST', body: payload });
}

export async function patchRepo(token, owner, repo, payload) {
  return apiRequest(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`, {
    token, method: 'PATCH', body: payload,
  });
}
