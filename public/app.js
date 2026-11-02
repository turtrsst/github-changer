/* ============================================================
   GitHub Changer — front-end (vanilla ES modules, tanpa build)
   ============================================================ */
'use strict';

/* ----------------------------- Ikon ----------------------------- */
const ICONS = {
  dashboard: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
  repo: '<path d="M4 4h13l3 3v13H4z"/><path d="M4 8h16M8 4v4"/>',
  github: '<path d="M9 19c-4 1.4-4-2-6-2m12 4v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.3 4.3 0 0 0-.1-3.2s-1-.3-3.4 1.3a11.6 11.6 0 0 0-6 0C6.3 2.8 5.3 3.1 5.3 3.1a4.3 4.3 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"/>',
  activity: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
  sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  branch: '<circle cx="6" cy="5" r="2"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="7" r="2"/><path d="M6 7v10M18 9a6 6 0 0 1-6 6H6"/>',
  'arrow-up': '<path d="M12 19V5M5 12l7-7 7 7"/>',
  'arrow-down': '<path d="M12 5v14M19 12l-7 7-7-7"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>',
  check: '<path d="m5 13 4 4L19 7"/>',
  close: '<path d="M18 6 6 18M6 6l12 12"/>',
  terminal: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m6 9 3 3-3 3M12 15h5"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>',
  sparkles: '<path d="m12 3 1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7-4.7-1.8 4.7-1.8Z"/><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8Z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  archive: '<rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8M10 12h4"/>',
  link: '<path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1"/>',
  server: '<rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 8h.01M7 17h.01"/>',
  zap: '<path d="m13 2-9 12h7l-1 8 9-12h-7Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>',
  alert: '<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/>',
  code: '<path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 4l-4 16"/>',
  git: '<circle cx="7" cy="6" r="2"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="12" r="2"/><path d="M7 8v8M9 6h4a4 4 0 0 1 4 4M9 18h4a4 4 0 0 0 4-4"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5M4 20h16"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
};
const ic = (name, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ${extra} aria-hidden="true">${ICONS[name] || ICONS.git}</svg>`;

/* ----------------------------- Helper ----------------------------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const val = (name, root = document) => $(`[data-field="${name}"]`, root)?.value?.trim() || '';
const checked = (name, root = document) => Boolean($(`[data-field="${name}"]`, root)?.checked);
const num = (n) => Number(n || 0).toLocaleString('id-ID');

// localStorage bisa diblokir (iframe pihak ketiga / mode privat). Fallback ke memori
// supaya app tetap jalan, hanya sesi tidak bertahan setelah reload.
const LS = (() => {
  const mem = new Map();
  return {
    get(k) { try { return localStorage.getItem(k); } catch { return mem.get(k) ?? null; } },
    set(k, v) { mem.set(k, v); try { localStorage.setItem(k, v); } catch { /* ignore */ } },
    del(k) { mem.delete(k); try { localStorage.removeItem(k); } catch { /* ignore */ } },
  };
})();

function timeAgo(iso) {
  if (!iso) return '—';
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'baru saja';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} menit lalu`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} jam lalu`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} hari lalu`;
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}
const fmtTime = (iso) => iso ? new Date(iso).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : '—';
const shortUrl = (url) => String(url || '').replace(/^https?:\/\//, '').replace(/\.git$/, '').replace(/^git@github\.com:/, 'github.com/');

const OP = {
  push: { label: 'Push', icon: 'arrow-up' }, pull: { label: 'Pull', icon: 'arrow-down' },
  fetch: { label: 'Fetch', icon: 'refresh' }, clone: { label: 'Clone', icon: 'download' },
  init: { label: 'Init', icon: 'plus' }, commit: { label: 'Commit', icon: 'git' },
  checkout: { label: 'Checkout', icon: 'branch' }, branch: { label: 'Branch', icon: 'branch' },
  remote: { label: 'Remote', icon: 'link' }, status: { label: 'Status', icon: 'eye' },
  'repo:create': { label: 'Buat repo', icon: 'plus' }, 'repo:archive': { label: 'Arsipkan', icon: 'archive' },
  'repo:unarchive': { label: 'Buka arsip', icon: 'archive' }, 'repo:update': { label: 'Ubah repo', icon: 'sliders' },
};

/* ----------------------------- State ----------------------------- */
const S = {
  boot: null, params: null, repos: null, gh: null, ghRate: null,
  activity: { entries: [], stats: {} }, context: null, errors: {},
  view: 'dashboard', search: '', repoFilter: 'all', ghSearch: '', ghFilter: 'all',
  actFilter: { op: '', accountId: '', repo: '' },
  drawer: null, drawerTab: 'overview', detail: null, terminal: [],
  modal: null, flow: null, flowHost: 'login', flowTimer: null, tickTimer: null,
  dropdown: false, es: null, demo: false, busy: false,
  token: LS.get('ghc.token') || '',
  pin: LS.get('ghc.pin') || '',
  theme: null, accent: null,
};

/* ----------------------------- API ----------------------------- */
async function api(pathname, { method = 'GET', body } = {}) {
  if (S.demo && method !== 'GET') throw new Error('Mode pratinjau: masuk dengan GitHub dulu untuk menjalankan aksi ini.');
  const headers = { 'Content-Type': 'application/json' };
  if (S.token) headers.Authorization = `Bearer ${S.token}`;
  if (S.pin) headers['X-App-Pin'] = S.pin;
  let response;
  try {
    response = await fetch(pathname, {
      method, headers, credentials: 'same-origin',
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    throw new Error(`Tidak bisa menghubungi server lokal: ${error.message}`);
  }
  let data = {};
  try { data = await response.json(); } catch { /* non-JSON */ }
  if (!response.ok || data.ok === false) {
    const error = new Error(data.error || `HTTP ${response.status}`);
    error.status = response.status;
    error.details = data.details;
    throw error;
  }
  return data;
}

function toast(title, message, kind = 'good') {
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<span class="dot ${kind === 'bad' ? 'bad' : kind === 'warn' ? 'warn' : 'good'}"></span>
    <div><b>${esc(title)}</b>${message ? `<small>${esc(message)}</small>` : ''}</div>`;
  $('#toast-root').appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 260); }, 4200);
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(String(text));
  } catch {
    const ta = document.createElement('textarea');
    ta.value = String(text); document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch { /* ignore */ }
    ta.remove();
  }
  toast('Tersalin', String(text).slice(0, 80));
}

function applyTheme() {
  const cfg = S.boot?.config;
  document.documentElement.dataset.theme = S.theme || cfg?.ui?.theme || 'dark';
  document.documentElement.dataset.accent = S.accent || cfg?.ui?.accent || 'aurora';
}
function setToken(token) {
  S.token = token || '';
  if (token) LS.set('ghc.token', token);
  else LS.del('ghc.token');
}

/* ----------------------------- Bootstrap & data ----------------------------- */
async function bootstrap() {
  S.boot = await api('/api/bootstrap');
  S.theme = S.boot.config.ui.theme;
  S.accent = S.boot.config.ui.accent;
  applyTheme();
  return S.boot;
}

async function loadRepos(refresh = false) {
  if (S.demo) return;
  try {
    const d = await api(`/api/repos${refresh ? '?refresh=1' : ''}`);
    S.repos = d.repos;
    S.errors.repos = null;
  } catch (error) { S.errors.repos = error.message; if (!S.repos) S.repos = []; }
  if (S.view === 'repos') renderRepoList();
  if (S.view === 'dashboard') renderView();
}

async function loadGithub() {
  if (S.demo) return;
  try {
    const d = await api('/api/github/repos');
    S.gh = d.repos; S.ghRate = d.rate; S.errors.github = null;
  } catch (error) { S.errors.github = error.message; if (!S.gh) S.gh = []; }
  if (S.view === 'github') renderGhList();
  if (S.view === 'dashboard') renderView();
}

async function activityQuery() {
  const q = new URLSearchParams({ limit: '300' });
  if (S.actFilter.op) q.set('op', S.actFilter.op);
  if (S.actFilter.accountId) q.set('accountId', S.actFilter.accountId);
  if (S.actFilter.repo) q.set('repo', S.actFilter.repo);
  return q.toString();
}

async function loadActivity() {
  if (S.demo) return;
  try {
    const d = await api(`/api/activity?${activityQuery()}`);
    S.activity = { entries: d.entries, stats: d.stats };
    S.errors.activity = null;
  } catch (error) { S.errors.activity = error.message; }
  if (S.view === 'activity') renderActivityBody();
  if (S.view === 'dashboard') renderView();
}

async function loadParams() {
  if (S.demo) return;
  try { S.params = await api('/api/parameters'); } catch (error) { S.errors.params = error.message; }
  if (S.view === 'params') renderParamsBody();
}

async function loadContext() {
  if (S.demo) return;
  try { const d = await api('/api/arena/context'); S.context = d.context; } catch { /* opsional */ }
  if (S.view === 'dashboard') renderView();
}

async function loadAll(refresh = false) {
  if (S.demo) return;
  await Promise.allSettled([loadRepos(refresh), loadGithub(), loadActivity(), loadParams(), loadContext()]);
}

function connectSSE() {
  if (S.demo || !S.boot?.authenticated) return;
  if (S.es) S.es.close();
  const q = new URLSearchParams();
  if (S.token) q.set('token', S.token);
  if (S.pin) q.set('pin', S.pin);
  try {
    S.es = new EventSource(`/api/events?${q.toString()}`);
    S.es.addEventListener('git', (event) => {
      let data = {}; try { data = JSON.parse(event.data); } catch { return; }
      if (data.type === 'output' && data.text != null) pushTerminal(data.kind === 'stderr' ? 'err' : '', data.text);
      if (data.type === 'end') {
        pushTerminal(data.success ? 'ok' : 'err', `\n✔ ${data.action} selesai` + (data.success ? '' : ` (gagal)`) + ` · ${data.durationMs}ms\n`);
      }
    });
    S.es.addEventListener('activity', () => loadActivity());
  } catch { /* SSE opsional */ }
}

/* ----------------------------- Data pratinjau ----------------------------- */
const DEMO_ACCOUNT = { id: 'demo', login: 'preview.user', name: 'Preview User', email: 'preview@example.com', avatarUrl: '', kind: 'demo' };
const DEMO_REPOS = [
  { path: '/home/user/github-changer', name: 'github-changer', branch: 'arena/a2271201-github-changer', upstream: 'origin/main', ahead: 2, behind: 0, head: 'e2ac479', dirty: { total: 3, staged: 1, unstaged: 1, untracked: 1, files: [] }, remotes: [{ name: 'origin', fetchUrl: 'https://github.com/turtrsst/github-changer.git', pushUrl: 'https://github.com/turtrsst/github-changer.git' }], lastCommit: { short: 'e2ac479', subject: 'Initial commit', author: 'turtrsst' } },
  { path: '/home/user/portfolio', name: 'portfolio', branch: 'main', upstream: 'origin/main', ahead: 0, behind: 1, head: '7bd91c2', dirty: { total: 0, staged: 0, unstaged: 0, untracked: 0, files: [] }, remotes: [{ name: 'origin', fetchUrl: 'https://github.com/turtrsst/portfolio.git', pushUrl: 'https://github.com/turtrsst/portfolio.git' }], lastCommit: { short: '7bd91c2', subject: 'feat: hero section', author: 'turtrsst' } },
  { path: '/home/user/notes-api', name: 'notes-api', branch: 'develop', upstream: 'origin/develop', ahead: 0, behind: 0, head: 'c19a4e0', dirty: { total: 5, staged: 0, unstaged: 3, untracked: 2, files: [] }, remotes: [{ name: 'origin', fetchUrl: 'git@github.com:turtrsst/notes-api.git', pushUrl: 'git@github.com:turtrsst/notes-api.git' }], lastCommit: { short: 'c19a4e0', subject: 'chore: update deps', author: 'turtrsst' } },
];
const DEMO_GH = [
  { fullName: 'turtrsst/github-changer', name: 'github-changer', private: false, description: 'Dashboard lokal untuk maintain akun & repo GitHub', language: 'JavaScript', updatedAt: new Date().toISOString(), defaultBranch: 'main', cloneUrl: 'https://github.com/turtrsst/github-changer.git', htmlUrl: 'https://github.com/turtrsst/github-changer', archived: false, stargazers: 12 },
  { fullName: 'turtrsst/portfolio', name: 'portfolio', private: false, description: 'Personal site', language: 'TypeScript', updatedAt: new Date(Date.now() - 864e5).toISOString(), defaultBranch: 'main', cloneUrl: 'https://github.com/turtrsst/portfolio.git', htmlUrl: 'https://github.com/turtrsst/portfolio', archived: false, stargazers: 3 },
  { fullName: 'turtrsst/notes-api', name: 'notes-api', private: true, description: 'Catatan harian API', language: 'Python', updatedAt: new Date(Date.now() - 6 * 864e5).toISOString(), defaultBranch: 'develop', cloneUrl: 'https://github.com/turtrsst/notes-api.git', htmlUrl: 'https://github.com/turtrsst/notes-api', archived: false, stargazers: 0 },
  { fullName: 'turtrsst/old-landing', name: 'old-landing', private: false, description: 'Landing page lama', language: 'HTML', updatedAt: new Date(Date.now() - 90 * 864e5).toISOString(), defaultBranch: 'main', cloneUrl: 'https://github.com/turtrsst/old-landing.git', htmlUrl: 'https://github.com/turtrsst/old-landing', archived: true, stargazers: 1 },
];
const DEMO_ENTRIES = [
  { id: 'd1', ts: new Date(Date.now() - 12 * 60000).toISOString(), op: 'push', success: true, email: 'preview@example.com', login: 'preview.user', durationMs: 1840, from: { label: 'Lokal · main @ e2ac479', branch: 'main' }, to: { label: 'origin/main · https://github.com/turtrsst/github-changer.git', url: 'https://github.com/turtrsst/github-changer.git', branch: 'main' }, repo: { name: 'github-changer' }, summary: 'Push main → origin/main', command: 'git push origin main', output: 'Everything up-to-date' },
  { id: 'd2', ts: new Date(Date.now() - 45 * 60000).toISOString(), op: 'commit', success: true, email: 'preview@example.com', login: 'preview.user', durationMs: 320, from: { label: 'Working tree · 3 perubahan' }, to: { label: 'Lokal · main @ e2ac479' }, repo: { name: 'github-changer' }, summary: 'Commit ke main', command: 'git commit -m "feat: dashboard"', output: '[main e2ac479] feat: dashboard' },
  { id: 'd3', ts: new Date(Date.now() - 3 * 3600000).toISOString(), op: 'pull', success: true, email: 'preview@example.com', login: 'preview.user', durationMs: 2210, from: { label: 'origin/main · https://github.com/turtrsst/portfolio.git', url: 'https://github.com/turtrsst/portfolio.git', branch: 'origin/main' }, to: { label: 'Lokal · main @ 7bd91c2', branch: 'main' }, repo: { name: 'portfolio' }, summary: 'Pull origin/main → main', command: 'git pull --ff-only origin main', output: 'Fast-forward' },
  { id: 'd4', ts: new Date(Date.now() - 26 * 3600000).toISOString(), op: 'push', success: true, email: 'preview@example.com', login: 'preview.user', durationMs: 3100, from: { label: 'Lokal · develop @ c19a4e0', branch: 'develop' }, to: { label: 'origin/develop · git@github.com:turtrsst/notes-api.git', url: 'git@github.com:turtrsst/notes-api.git', branch: 'develop' }, repo: { name: 'notes-api' }, summary: 'Push develop → origin/develop', command: 'git push origin develop', output: 'ok' },
  { id: 'd5', ts: new Date(Date.now() - 50 * 3600000).toISOString(), op: 'fetch', success: true, email: 'preview@example.com', login: 'preview.user', durationMs: 900, from: { label: 'origin · https://github.com/turtrsst/github-changer.git', url: 'https://github.com/turtrsst/github-changer.git' }, to: { label: 'Lokal · refs/remotes/origin/*' }, repo: { name: 'github-changer' }, summary: 'Fetch dari origin', command: 'git fetch --prune --tags origin', output: '' },
  { id: 'd6', ts: new Date(Date.now() - 74 * 3600000).toISOString(), op: 'clone', success: true, email: 'preview@example.com', login: 'preview.user', durationMs: 5400, from: { label: 'https://github.com/turtrsst/notes-api.git', url: 'https://github.com/turtrsst/notes-api.git' }, to: { label: 'Lokal · /home/user/notes-api' }, repo: { name: 'notes-api' }, summary: 'Clone → /home/user/notes-api', command: 'git clone … notes-api', output: 'done' },
  { id: 'd7', ts: new Date(Date.now() - 96 * 3600000).toISOString(), op: 'push', success: false, email: 'preview@example.com', login: 'preview.user', durationMs: 1200, from: { label: 'Lokal · main @ 8ac1d20' }, to: { label: 'origin/main · https://github.com/turtrsst/portfolio.git', url: 'https://github.com/turtrsst/portfolio.git', branch: 'main' }, repo: { name: 'portfolio' }, summary: 'Gagal: push', command: 'git push origin main', output: 'rejected: non-fast-forward' },
  { id: 'd8', ts: new Date(Date.now() - 120 * 3600000).toISOString(), op: 'repo:create', success: true, email: 'preview@example.com', login: 'preview.user', durationMs: 0, from: { label: 'GitHub · preview@example.com' }, to: { label: 'https://github.com/turtrsst/notes-api', url: 'https://github.com/turtrsst/notes-api.git' }, repo: { name: 'turtrsst/notes-api' }, summary: 'Buat repository', command: 'POST /user/repos', output: '' },
];
function demoStats() {
  const pushes = DEMO_ENTRIES.filter((e) => e.op === 'push' && e.success);
  const pulls = DEMO_ENTRIES.filter((e) => ['pull', 'fetch', 'clone'].includes(e.op) && e.success);
  const group = (items, pick) => {
    const map = new Map();
    for (const e of items) {
      const key = pick(e) || 'tidak diketahui';
      const prev = map.get(key) || { key, count: 0, lastTs: e.ts, accounts: [], branches: [] };
      prev.count += 1; prev.accounts = [...new Set([...prev.accounts, e.email])];
      map.set(key, prev);
    }
    return [...map.values()].sort((a, b) => b.count - a.count);
  };
  return {
    total: DEMO_ENTRIES.length, success: DEMO_ENTRIES.filter((e) => e.success).length,
    failed: DEMO_ENTRIES.filter((e) => !e.success).length, pushes: pushes.length, pulls: pulls.length,
    destinations: group(pushes, (e) => e.to?.url), origins: group(pulls, (e) => e.from?.url),
    accounts: group(DEMO_ENTRIES, (e) => e.email), byOp: [],
  };
}
function enterDemo() {
  S.demo = true;
  S.boot.authenticated = true;
  S.boot.account = DEMO_ACCOUNT;
  S.boot.accounts = [DEMO_ACCOUNT];
  S.boot.activeAccountId = 'demo';
  S.repos = DEMO_REPOS; S.gh = DEMO_GH; S.activity = { entries: DEMO_ENTRIES, stats: demoStats() };
  S.context = { label: 'Arena AI', text: 'Project: github-changer\nPath lokal: /home/user/github-changer\nBranch: arena/a2271201-github-changer\nAkun GitHub aktif: preview.user <preview@example.com>\n\nSaya suka banget pakai Arena AI buat ngoding', lines: [] };
  S.params = null; S.modal = null; S.drawer = null;
  if (S.es) { S.es.close(); S.es = null; }
  render();
  toast('Mode pratinjau', 'Data contoh saja — login GitHub untuk operasi nyata.', 'warn');
}

/* ----------------------------- Render: root ----------------------------- */
function render() {
  applyTheme();
  const app = $('#app');
  if (!S.boot) { app.innerHTML = bootScreenHTML(); return; }
  if (S.boot.pinRequired && !S.boot.pinOk) { app.innerHTML = pinScreenHTML(); return; }
  if (!S.boot.authenticated) { app.innerHTML = loginScreenHTML(); return; }
  app.innerHTML = shellHTML();
  renderView();
  renderDropdown();
  renderDrawer();
  renderModal();
  if (!S.demo) connectSSE();
}

function bootScreenHTML() {
  return `<div class="boot-screen"><div class="boot-logo">✦</div><div class="boot-title">GitHub Changer</div><div class="boot-sub">Menyiapkan dashboard Git lokal…</div><div class="boot-bar"><i></i></div></div>`;
}

function pinScreenHTML() {
  return `<div class="login-wrap"><div class="card pin-card pad">
    <div class="row" style="margin-bottom:14px"><span class="brand-mark">${ic('shield')}</span><div><div class="brand-name">Akses dibatasi</div><div class="tiny muted">APP_PIN aktif di server</div></div></div>
    <div class="field"><label>PIN aplikasi</label><input class="input" type="password" data-field="pin" placeholder="Masukkan PIN" autocomplete="off" /></div>
    <button class="btn primary block" style="margin-top:14px" data-action="pin-submit">Buka dashboard ${ic('chevron')}</button>
    <p class="login-note">PIN dikirim sebagai header X-App-Pin pada setiap permintaan dan disimpan di browser ini.</p>
  </div></div>`;
}

/* ----------------------------- Render: login ----------------------------- */
function loginScreenHTML() {
  const cfg = S.boot.config;
  const ready = Boolean(cfg.auth.clientId);
  return `<div class="login-wrap"><div class="login-grid">
    <div class="login-hero">
      <div class="row"><span class="brand-mark">✦</span><div><div class="brand-name">GitHub Changer</div><div class="brand-sub">Local Git Control Center</div></div></div>
      <h1>Satu tempat buat<br /><span class="gradient-text">semua urusan Git.</span></h1>
      <p>Push, pull, clone, commit, dan maintain repository langsung dari komputer/server kamu — dengan login GitHub asli dan catatan alur yang jelas: dari mana, ke mana, dan oleh siapa.</p>
      <div class="feature"><i>${ic('shield')}</i><span><b>OAuth Device Flow asli.</b> Login per email GitHub, token terenkripsi di disk.</span></div>
      <div class="feature"><i>${ic('arrow-up')}</i><span><b>Peta alur Git.</b> Tiap push/pull tercatat lengkap dengan remote URL, branch, dan SHA.</span></div>
      <div class="feature"><i>${ic('folder')}</i><span><b>Patuh path server.</b> Repository dipindai dari root project yang kamu tentukan.</span></div>
      <div class="feature"><i>${ic('sparkles')}</i><span><b>Parameter lengkap + Arena AI.</b> Semua pengaturan bisa diubah dari UI.</span></div>
      <div class="foot">Git ${esc(S.boot.environment.git.ok ? S.boot.environment.git.version : 'tidak terdeteksi')} · ${S.boot.accountCount} akun tersimpan · ${esc(S.boot.app.projectRoot)}</div>
    </div>
    <div class="login-panel" id="login-panel">
      ${S.flow && S.flowHost === 'login' ? flowCardHTML() : loginMainHTML(ready, cfg)}
    </div>
  </div></div>${S.boot.pinRequired ? '' : ''}`;
}

function loginMainHTML(ready, cfg) {
  return `<div class="eyebrow">Otentikasi GitHub</div>
    <h2>Masuk dengan GitHub</h2>
    <p>Akun dikenali dari <b>email utama GitHub</b> yang terverifikasi. Nanti bisa tambah & ganti-ganti akun (multi-akun).</p>
    ${ready ? '' : `<div class="setup-box">
      <b>${ic('alert')} OAuth Client ID belum diatur</b>
      <p>App ini pakai <b>OAuth 2.0 Device Flow</b>: cukup Client ID, tanpa client secret dan tanpa callback URL. Ini login GitHub asli, bukan token palsu.</p>
      <ol>
        <li>Buka <a href="https://github.com/settings/developers" target="_blank" rel="noopener"><u>github.com/settings/developers</u></a> → <b>New OAuth App</b>.</li>
        <li>Homepage URL bebas (mis. <code>http://localhost:4173</code>), callback URL boleh diisi <code>http://localhost:4173</code>.</li>
        <li>Setelah dibuat, centang <b>Enable Device Flow</b>, lalu salin <b>Client ID</b>-nya ke bawah.</li>
      </ol>
      <div class="field"><label>Client ID</label><input class="input mono" data-field="clientId" placeholder="Iv1.xxxxxxxxxxxxxxxx" value="${esc(cfg.auth.clientId)}" /></div>
      <button class="btn primary block" style="margin-top:10px" data-action="save-client-id">Simpan Client ID</button>
      <p class="tiny faint" style="margin:8px 0 0">Bisa juga lewat <code>GITHUB_CLIENT_ID</code> di file <code>.env</code> (prioritas tertinggi).</p>
    </div>`}
    <button class="btn primary block" data-action="login-start" ${ready ? '' : 'disabled'}>${ic('github')} Masuk dengan GitHub</button>
    <p class="tiny muted" style="text-align:center;margin:10px 0 0">Kamu akan memberi kode 8 karakter di <b>github.com/login/device</b> — tidak ada password yang lewat ke app ini.</p>
    ${S.boot.accountCount > 0 ? `<div class="chip info" style="margin-top:16px">${S.boot.accountCount} akun tersimpan di komputer ini</div>` : ''}
    ${cfg.auth.allowPat ? `<details class="advanced"><summary>Opsi lanjutan: masuk dengan Personal Access Token</summary>
      <div class="field" style="margin-top:12px"><label>Token (scope: repo, read:user, user:email)</label><input class="input mono" type="password" data-field="pat" placeholder="ghp_…" /></div>
      <button class="btn block" style="margin-top:10px" data-action="pat-login">Pakai token</button>
    </details>` : ''}
    <div class="divider"></div>
    <button class="btn ghost block" data-action="enter-demo">${ic('eye')} Lihat pratinjau UI (data contoh)</button>
    <p class="login-note">Scope yang diminta: <code>${esc(cfg.auth.scopes)}</code>. Token dipakai untuk GitHub API dan autentikasi push/pull HTTPS lewat <code>GIT_ASKPASS</code> — tidak pernah disimpan di URL remote.</p>`;
}

function flowCardHTML() {
  const f = S.flow;
  if (!f) return '';
  const failed = f.done && f.status !== 'success';
  return `<div class="eyebrow">Otentikasi GitHub</div>
    <h2>${failed ? 'Login belum selesai' : 'Tinggal satu langkah lagi'}</h2>
    <p>${failed ? esc(f.message || 'Coba mulai ulang proses login.') : 'Buka halaman GitHub di bawah, masukkan kode ini, lalu klik <b>Authorize</b>.'}</p>
    ${failed ? `<button class="btn primary block" data-action="login-retry">${ic('refresh')} Coba lagi</button>
      <button class="btn ghost block" style="margin-top:8px" data-action="login-cancel">Kembali</button>` : `<div class="device-card">
      <div class="tiny muted">KODE PERANGKAT</div>
      <div class="device-code">${esc(f.userCode)}</div>
      <div class="btn-group" style="justify-content:center">
        <button class="btn sm" data-action="copy" data-copy="${esc(f.userCode)}">${ic('copy')} Salin kode</button>
        <a class="btn sm primary" href="${esc(f.verificationUri)}" target="_blank" rel="noopener">${ic('external')} Buka GitHub</a>
      </div>
      <div class="device-steps" style="margin-top:12px">1 · Buka link &nbsp;→&nbsp; 2 · Masukkan kode &nbsp;→&nbsp; 3 · Authorize</div>
    </div>
    <div class="row"><span class="live-dot"></span><span class="small muted" id="flow-status">${esc(f.message || 'Menunggu persetujuan di GitHub…')}</span><span class="spacer"></span><span class="mono tiny" id="flow-countdown">15:00</span></div>
    <div class="progress"><i id="flow-progress" style="width:100%"></i></div>
    <button class="btn ghost block" style="margin-top:14px" data-action="login-cancel">Batalkan</button>`}`;
}

/* ----------------------------- Render: shell ----------------------------- */
const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'repos', label: 'Repository', icon: 'repo' },
  { id: 'github', label: 'GitHub Remote', icon: 'github' },
  { id: 'activity', label: 'Alur Git', icon: 'activity' },
  { id: 'params', label: 'Parameters', icon: 'sliders' },
];
const VIEW_LABEL = Object.fromEntries(NAV.map((n) => [n.id, n.label]));

function shellHTML() {
  const env = S.boot.environment;
  const cfg = S.boot.config;
  const a = S.boot.account || {};
  return `<div class="shell">
    <aside class="sidebar">
      <div class="brand"><span class="brand-mark">✦</span><div><div class="brand-name">GitHub Changer</div><div class="brand-sub">v${esc(S.boot.app.version)} · lokal</div></div></div>
      <div><div class="nav-group-label">Workspace</div><nav class="nav">
        ${NAV.map((n) => `<button class="nav-item ${S.view === n.id ? 'active' : ''}" data-action="nav" data-view="${n.id}">${ic(n.icon)} ${n.label}${n.id === 'repos' && S.repos ? `<span class="count">${S.repos.length}</span>` : ''}${n.id === 'activity' && S.activity.stats?.total ? `<span class="count">${num(S.activity.stats.total)}</span>` : ''}</button>`).join('')}
      </nav></div>
      <div class="sidebar-foot">
        <div class="env-mini">
          <div class="row" style="margin-bottom:6px">${ic('terminal')}<b class="tiny">Git di server</b></div>
          <div class="row"><span>version</span><b class="truncate">${esc(env.git.ok ? env.git.version.replace('git version ', '') : 'tidak ada')}</b></div>
          <div class="row"><span>root</span><b class="truncate" title="${esc(cfg.workspace.roots.join(', '))}">${esc(cfg.workspace.roots.length)} folder</b></div>
          <div class="row"><span>oauth</span><b>${S.boot.oauthReady ? 'siap' : 'belum'}</b></div>
        </div>
        ${cfg.arena.showBadge && cfg.arena.enabled ? `<div class="arena-badge">${ic('sparkles')}<span><strong>${esc(cfg.arena.sessionLabel)}</strong> mode · hehe ✨</span></div>` : ''}
      </div>
    </aside>
    <main class="main">
      <header class="topbar">
        <div class="crumbs">GitHub Changer <span class="faint">/</span> <b>${esc(VIEW_LABEL[S.view])}</b></div>
        <div class="topbar-spacer"></div>
        <span class="live-pill"><span class="live-dot"></span> ${S.demo ? 'pratinjau' : 'terhubung'} · ${esc(a.login || '')}</span>
        <button class="btn icon ghost" data-action="refresh-all" title="Muat ulang data">${ic('refresh')}</button>
        <button class="btn icon ghost" data-action="theme-toggle" title="Ganti tema">${ic(S.theme === 'light' ? 'moon' : 'sun')}</button>
        <div class="account-menu" id="account-menu-wrap">
          <button class="account-btn" data-action="account-menu">
            ${a.avatarUrl ? `<img class="avatar" src="${esc(a.avatarUrl)}" alt="" />` : `<span class="avatar fallback">${esc((a.login || '?')[0].toUpperCase())}</span>`}
            <span class="account-name">${esc(a.login || 'akun')}</span>${ic('down')}
          </button>
          <div id="account-dropdown"></div>
        </div>
      </header>
      <div class="content" id="view-content"></div>
    </main>
  </div>`;
}

function renderDropdown() {
  const root = $('#account-dropdown');
  if (!root) return;
  if (!S.dropdown) { root.innerHTML = ''; return; }
  const list = S.boot.accounts || [];
  root.innerHTML = `<div class="dropdown">
    <div class="dropdown-label">Akun GitHub (${list.length})</div>
    ${list.map((acc) => `<button class="account-option ${acc.id === S.boot.activeAccountId ? 'active' : ''}" data-action="switch-account" data-id="${esc(acc.id)}">
      ${acc.avatarUrl ? `<img class="avatar" src="${esc(acc.avatarUrl)}" alt="" />` : `<span class="avatar fallback">${esc((acc.login || '?')[0].toUpperCase())}</span>`}
      <span class="meta"><div>${esc(acc.login)}</div><small>${esc(acc.email)}</small></span>
      ${acc.id === S.boot.activeAccountId ? ic('check') : ''}</button>`).join('')}
    <div class="dropdown-sep"></div>
    <button class="dropdown-action" data-action="add-account">${ic('plus')} Tambah akun GitHub</button>
    <button class="dropdown-action" data-action="nav" data-view="params">${ic('sliders')} Parameters & keamanan</button>
    <button class="dropdown-action danger" data-action="logout">${ic('logout')} Keluar</button>
  </div>`;
}

/* ----------------------------- Render: views ----------------------------- */
function renderView() {
  const root = $('#view-content');
  if (!root) return;
  const html = {
    dashboard: dashboardHTML, repos: reposHTML, github: githubHTML,
    activity: activityHTML, params: paramsHTML,
  }[S.view];
  root.innerHTML = html ? html() : '';
  if (S.view === 'repos') renderRepoList();
  if (S.view === 'github') renderGhList();
  if (S.view === 'activity') renderActivityBody();
  if (S.view === 'params') renderParamsBody();
}

function demoBanner() {
  return `<div class="card pad row wrap" style="margin-bottom:18px;border-color:color-mix(in srgb,var(--warn) 40%,var(--border));background:color-mix(in srgb,var(--warn) 8%,transparent)">
    ${ic('eye')}<div class="small"><b>Mode pratinjau</b> — data di bawah adalah contoh. Login GitHub asli diperlukan untuk push/pull & aksi nyata.</div>
    <span class="spacer"></span><button class="btn sm" data-action="demo-exit">${ic('logout')} Keluar & login</button></div>`;
}

function statCard(label, value, foot, glyph) {
  return `<div class="card stat"><div class="label">${esc(label)}</div><div class="value">${esc(value)}</div><div class="foot">${esc(foot)}</div><div class="glyph">${ic(glyph)}</div></div>`;
}

function flowItemHTML(e) {
  const meta = OP[e.op] || { label: e.op, icon: 'git' };
  return `<div class="flow-item">
    <div class="flow-icon ${e.success ? '' : 'bad'}">${ic(meta.icon)}</div>
    <div class="flow-main">
      <div class="flow-line">
        <span class="chip ${e.success ? 'info' : 'bad'}">${esc(meta.label)}</span>
        <span class="flow-node" title="${esc(e.from?.label || '')}">${esc(e.from?.label || '—')}</span>
        <span class="arrow">→</span>
        <span class="flow-node" title="${esc(e.to?.label || '')}">${esc(e.to?.label || '—')}</span>
      </div>
      <div class="flow-meta"><span>${esc(e.repo?.name || '')}</span><span>${esc(e.email || '')}</span><span>${timeAgo(e.ts)}</span><span>${e.durationMs ? `${(e.durationMs / 1000).toFixed(1)}s` : ''}</span></div>
    </div>
    <span class="dot ${e.success ? 'good' : 'bad'}" title="${e.success ? 'berhasil' : 'gagal'}"></span>
  </div>`;
}

function rankCard(title, items, subtitle, icon) {
  return `<div class="card"><div class="card-head">${ic(icon)}<h3>${esc(title)}</h3><span class="spacer"></span><small>${esc(subtitle)}</small></div>
    <div class="card-body">${items?.length ? items.slice(0, 6).map((item, i) => `<div class="rank-row">
      <span class="rank-num">${i + 1}</span>
      <div class="rank-body"><div class="t" title="${esc(item.key)}">${esc(shortUrl(item.key))}</div>
      <div class="s">${item.count} kali · ${item.accounts?.length || 0} akun · terakhir ${timeAgo(item.lastTs)}</div></div>
      <span class="rank-count">×${item.count}</span></div>`).join('') : `<div class="empty tiny">Belum ada data. Lakukan push/pull dulu.</div>`}</div></div>`;
}

function dashboardHTML() {
  const a = S.boot.account || {};
  const cfg = S.boot.config;
  const stats = S.activity.stats || {};
  const repos = S.repos || [];
  const dirty = repos.filter((r) => r.dirty.total > 0).length;
  const ahead = repos.filter((r) => r.ahead > 0).length;
  const flows = (S.activity.entries || []).filter((e) => ['push', 'pull', 'fetch', 'clone', 'commit'].includes(e.op)).slice(0, 6);
  const env = S.boot.environment;
  return `${S.demo ? demoBanner() : ''}
  <div class="view-head"><div><div class="eyebrow">Overview</div><h1>Halo, ${esc(a.name || a.login || 'kamu')} 👋</h1>
    <p>Semua repo & alur Git dalam satu tempat · <span class="mono">${esc(a.email)}</span></p></div>
    <div class="spacer"></div><div class="btn-group">
      <button class="btn" data-action="scan-repos">${ic('refresh')} Pindai ulang</button>
      <button class="btn primary" data-action="clone-open">${ic('plus')} Clone repo</button>
    </div></div>
  <div class="grid g4" style="margin-bottom:16px">
    ${statCard('Repository lokal', S.repos === null ? '…' : repos.length, `${dirty} ada perubahan · ${ahead} ahead`, 'repo')}
    ${statCard('Repo di GitHub', S.gh === null ? '…' : (S.gh || []).length, cfg.auth.clientId ? 'sinkron via GitHub API' : 'OAuth belum diatur', 'github')}
    ${statCard('Push tercatat', num(stats.pushes), 'dengan tujuan lengkap', 'arrow-up')}
    ${statCard('Pull / fetch', num(stats.pulls), 'dengan sumber lengkap', 'arrow-down')}
  </div>
  <div class="grid bento" style="margin-bottom:16px">
    <div class="card"><div class="card-head">${ic('activity')}<h3>Alur Git terbaru</h3><span class="spacer"></span>
      <button class="btn sm ghost" data-action="nav" data-view="activity">Lihat semua ${ic('chevron')}</button></div>
      <div class="card-body" style="padding-top:4px">${flows.length ? flows.map(flowItemHTML).join('') : `<div class="empty"><div class="big">↗</div><strong>Belum ada aktivitas</strong>Lakukan push atau pull dari halaman Repository.</div>`}</div></div>
    <div class="stack">
      ${cfg.arena.enabled ? `<div class="card"><div class="card-head">${ic('sparkles')}<h3>${esc(cfg.arena.sessionLabel)} · konteks</h3><span class="spacer"></span><span class="chip accent">hehe ✨</span></div>
        <div class="card-body"><div class="tiny muted" style="line-height:1.9;white-space:pre-wrap;font-family:var(--mono)">${esc((S.context?.text || 'Memuat konteks project…').split('\n').slice(0, 8).join('\n'))}</div>
        <div class="btn-group" style="margin-top:14px"><button class="btn sm" data-action="copy-context">${ic('copy')} Salin konteks</button>
        <button class="btn sm" data-action="template-commit">${ic('code')} Template commit</button></div></div></div>` : ''}
      <div class="card"><div class="card-head">${ic('zap')}<h3>Aksi cepat</h3></div><div class="card-body">
        <div class="btn-group">
          <button class="btn sm" data-action="fetch-all">${ic('refresh')} Fetch semua</button>
          <button class="btn sm" data-action="gh-create-open">${ic('plus')} Repo baru</button>
          <button class="btn sm" data-action="nav" data-view="params">${ic('sliders')} Parameters</button>
        </div>
        <p class="tiny faint" style="margin:12px 0 0">Semua aksi memakai akun <b>${esc(a.email)}</b> dan dicatat riwayatnya.</p>
      </div></div>
    </div>
  </div>
  <div class="grid g2" style="margin-bottom:16px">
    ${rankCard('Push ke mana saja', stats.destinations, 'tujuan remote', 'arrow-up')}
    ${rankCard('Pull dari mana saja', stats.origins, 'sumber remote', 'arrow-down')}
  </div>
  <div class="card"><div class="card-head">${ic('server')}<h3>Lingkungan server</h3><span class="spacer"></span><small>disesuaikan dengan Git di komputer ini</small></div>
    <div class="card-body grid g2">
      <div><div class="kv"><span class="k">Git binary</span><span class="v">${esc(env.git.path)}</span>
        <span class="k">Versi</span><span class="v">${esc(env.git.version || '—')}</span>
        <span class="k">GitHub CLI</span><span class="v">${esc(env.gh.ok ? env.gh.version : 'tidak terinstal (opsional)')}</span>
        <span class="k">Node.js</span><span class="v">${esc(env.node)} · ${esc(env.platform)}</span></div></div>
      <div><div class="tiny muted" style="margin-bottom:8px">Root project yang dipindai</div>
        ${(env.roots || []).map((r) => `<div class="row" style="margin-bottom:6px"><span class="dot ${r.exists && r.writable ? 'good' : 'bad'}"></span><span class="mono tiny truncate" title="${esc(r.path)}">${esc(r.path)}</span><span class="spacer"></span><span class="chip ${r.exists && r.writable ? 'good' : 'bad'}">${r.exists && r.writable ? 'valid' : 'tidak valid'}</span></div>`).join('')}
        <div class="tiny faint" style="margin-top:10px">Data & token: <code>${esc(S.boot.app.dataDir)}</code></div></div>
    </div></div>`;
}

/* ----------------------------- Repository ----------------------------- */
function reposHTML() {
  return `<div class="view-head"><div><div class="eyebrow">Workspace</div><h1>Repository lokal</h1>
    <p>Hasil pemindaian root project di server · klik baris untuk detail & aksi lengkap.</p></div>
    <div class="spacer"></div><div class="btn-group">
      <button class="btn" data-action="init-open">${ic('plus')} Init repo</button>
      <button class="btn primary" data-action="clone-open">${ic('download')} Clone</button>
    </div></div>
  <div class="card"><div class="card-head">
    <input class="input" style="max-width:270px" data-search="repos" placeholder="Cari nama / path / remote…" value="${esc(S.search)}" />
    <div class="btn-group">
      ${[['all', 'Semua'], ['dirty', 'Ada perubahan'], ['ahead', 'Ahead'], ['behind', 'Behind']].map(([k, l]) => `<button class="btn sm ${S.repoFilter === k ? 'primary' : ''}" data-action="repo-filter" data-filter="${k}">${l}</button>`).join('')}
    </div>
    <span class="spacer"></span><button class="btn sm" data-action="scan-repos">${ic('refresh')} Scan ulang</button>
  </div><div id="repo-list"></div></div>
  ${S.errors.repos ? `<div class="card pad" style="margin-top:14px;color:var(--bad)">${ic('alert')} ${esc(S.errors.repos)}</div>` : ''}`;
}

function renderRepoList() {
  const root = $('#repo-list');
  if (!root) return;
  if (S.repos === null) {
    root.innerHTML = Array.from({ length: 4 }, () => `<div class="loading-row"><div class="skeleton"></div><div class="lines"><div class="skeleton" style="width:40%"></div><div class="skeleton" style="width:65%"></div></div></div>`).join('');
    return;
  }
  const q = S.search.toLowerCase();
  let list = S.repos.filter((r) => !q || [r.name, r.path, r.branch, ...(r.remotes || []).map((x) => x.pushUrl)].join(' ').toLowerCase().includes(q));
  if (S.repoFilter === 'dirty') list = list.filter((r) => r.dirty.total > 0);
  if (S.repoFilter === 'ahead') list = list.filter((r) => r.ahead > 0);
  if (S.repoFilter === 'behind') list = list.filter((r) => r.behind > 0);
  if (!list.length) {
    root.innerHTML = `<div class="empty"><div class="big">${ic('folder')}</div><strong>Tidak ada repository yang cocok</strong>Tambah root project di Parameters, atau clone repo baru.</div>`;
    return;
  }
  root.innerHTML = list.map((r) => {
    const remote = r.remotes?.[0];
    return `<div class="repo-row">
      <div class="repo-title"><span class="repo-glyph">${ic('repo')}</span><div style="min-width:0"><b>${esc(r.name)}</b><small title="${esc(r.path)}">${esc(r.path)}</small></div></div>
      <div class="hide-sm"><div class="badges">
        <span class="chip accent">${ic('branch')} ${esc(r.branch)}</span>
        ${r.ahead ? `<span class="chip good">↑${r.ahead}</span>` : ''}${r.behind ? `<span class="chip warn">↓${r.behind}</span>` : ''}
        ${r.dirty.total ? `<span class="chip warn">${r.dirty.total} berubah</span>` : `<span class="chip good">bersih</span>`}</div>
        <div class="tiny faint" style="margin-top:5px">${esc(r.lastCommit?.short || '')} ${esc(r.lastCommit?.subject || '')}</div></div>
      <div class="url-cell" title="${esc(remote?.pushUrl || 'belum ada remote')}">${remote ? `→ ${esc(shortUrl(remote.pushUrl))}` : '<span class="faint">belum ada remote</span>'}</div>
      <div class="btn-group">
        <button class="btn sm" data-action="quick-op" data-op="fetch" data-path="${esc(r.path)}" title="Fetch">${ic('refresh')}</button>
        <button class="btn sm" data-action="quick-op" data-op="pull" data-path="${esc(r.path)}">Pull</button>
        <button class="btn sm primary" data-action="quick-op" data-op="push" data-path="${esc(r.path)}">Push</button>
        <button class="btn sm icon" data-action="repo-open" data-path="${esc(r.path)}" title="Detail">${ic('chevron')}</button>
      </div></div>`;
  }).join('');
}

function githubHTML() {
  return `<div class="view-head"><div><div class="eyebrow">GitHub API</div><h1>Repository di GitHub</h1>
    <p>Daftar repo milik akun aktif · buat, arsipkan, atau clone langsung ke root project.</p></div>
    <div class="spacer"></div><div class="btn-group">
      <button class="btn" data-action="refresh-gh">${ic('refresh')} Muat ulang</button>
      <button class="btn primary" data-action="gh-create-open">${ic('plus')} Buat repository</button>
    </div></div>
  <div class="card" style="margin-bottom:16px"><div class="card-head">
    <input class="input" style="max-width:270px" data-search="gh" placeholder="Cari repository…" value="${esc(S.ghSearch)}" />
    <div class="btn-group">${[['all', 'Semua'], ['public', 'Public'], ['private', 'Private'], ['archived', 'Arsip']].map(([k, l]) => `<button class="btn sm ${S.ghFilter === k ? 'primary' : ''}" data-action="gh-filter" data-filter="${k}">${l}</button>`).join('')}</div>
    <span class="spacer"></span><small>${S.ghRate?.remaining ? `Rate limit: ${S.ghRate.remaining}/${S.ghRate.limit}` : ''}</small>
  </div></div>
  <div id="gh-list" class="grid g3"></div>
  ${S.errors.github ? `<div class="card pad" style="margin-top:14px;color:var(--bad)">${ic('alert')} ${esc(S.errors.github)} — cek token / koneksi ke api.github.com.</div>` : ''}`;
}

function renderGhList() {
  const root = $('#gh-list');
  if (!root) return;
  if (S.gh === null) { root.innerHTML = Array.from({ length: 3 }, () => `<div class="card pad"><div class="skeleton" style="width:50%;height:16px;margin-bottom:12px"></div><div class="skeleton" style="height:10px"></div></div>`).join(''); return; }
  const q = S.ghSearch.toLowerCase();
  let list = (S.gh || []).filter((r) => !q || `${r.fullName} ${r.description}`.toLowerCase().includes(q));
  if (S.ghFilter === 'public') list = list.filter((r) => !r.private);
  if (S.ghFilter === 'private') list = list.filter((r) => r.private);
  if (S.ghFilter === 'archived') list = list.filter((r) => r.archived);
  if (!list.length) { root.innerHTML = `<div class="card pad empty" style="grid-column:1/-1">Tidak ada repository yang cocok.</div>`; return; }
  root.innerHTML = list.map((r) => `<div class="card gh-card">
    <div class="row"><span class="repo-glyph" style="width:28px;height:28px">${ic('github')}</span><div class="name truncate">${esc(r.name)}</div><span class="spacer"></span>
      <span class="chip ${r.private ? 'warn' : 'good'}">${r.private ? 'private' : 'public'}</span></div>
    <div class="desc">${esc(r.description || 'Tanpa deskripsi')}</div>
    <div class="foot">${r.language ? `<span class="dot" style="background:var(--a2)"></span>${esc(r.language)}` : ''}<span>${ic('branch')} ${esc(r.defaultBranch)}</span><span>★ ${r.stargazers || 0}</span><span>${timeAgo(r.updatedAt)}</span></div>
    ${r.archived ? `<span class="chip warn">${ic('archive')} diarsipkan</span>` : ''}
    <div class="btn-group" style="margin-top:auto">
      <button class="btn sm primary" data-action="gh-clone" data-url="${esc(r.cloneUrl)}" data-name="${esc(r.name)}">${ic('download')} Clone</button>
      <a class="btn sm" href="${esc(r.htmlUrl)}" target="_blank" rel="noopener">${ic('external')} Buka</a>
      <button class="btn sm" data-action="gh-archive" data-full="${esc(r.fullName)}" data-archived="${r.archived ? '1' : ''}">${r.archived ? 'Buka arsip' : 'Arsipkan'}</button>
    </div></div>`).join('');
}

/* ----------------------------- Alur Git ----------------------------- */
function activityHTML() {
  return `<div class="view-head"><div><div class="eyebrow">Audit trail</div><h1>Alur Git</h1>
    <p>Rekam jejak setiap operasi: <b>dari mana</b> → <b>ke mana</b>, branch, remote URL, akun, dan hasilnya.</p></div>
    <div class="spacer"></div><div class="btn-group">
      <button class="btn" data-action="activity-export">${ic('copy')} Salin ringkasan</button>
      <button class="btn danger" data-action="activity-clear">${ic('trash')} Kosongkan</button>
    </div></div>
  <div id="activity-body"></div>`;
}

function renderActivityBody() {
  const root = $('#activity-body');
  if (!root) return;
  const st = S.activity.stats || {};
  const entries = S.activity.entries || [];
  const opts = [['', 'Semua aksi'], ...Object.keys(OP).map((k) => [k, OP[k].label])];
  root.innerHTML = `<div class="grid g4" style="margin-bottom:16px">
    ${statCard('Total operasi', num(st.total), `${num(st.success)} berhasil`, 'activity')}
    ${statCard('Push', num(st.pushes), 'ke remote terekam', 'arrow-up')}
    ${statCard('Pull / fetch', num(st.pulls), 'dari remote terekam', 'arrow-down')}
    ${statCard('Gagal', num(st.failed), 'perlu diperiksa', 'alert')}
  </div>
  <div class="grid g2" style="margin-bottom:16px">
    ${rankCard('Tujuan push', st.destinations, 'group by remote push URL', 'arrow-up')}
    ${rankCard('Sumber pull / fetch / clone', st.origins, 'group by remote fetch URL', 'arrow-down')}
  </div>
  <div class="card"><div class="card-head">${ic('clock')}<h3>Riwayat operasi</h3><span class="spacer"></span><small>${entries.length} entri</small></div>
    <div class="card-head" style="border-top:0">
      <select class="input" style="max-width:180px" data-filter="op"><option value="">Semua aksi</option>${Object.entries(OP).map(([k, v]) => `<option value="${k}" ${S.actFilter.op === k ? 'selected' : ''}>${v.label}</option>`).join('')}</select>
      <select class="input" style="max-width:210px" data-filter="accountId"><option value="">Semua akun</option>${(S.boot.accounts || []).map((a) => `<option value="${esc(a.id)}" ${S.actFilter.accountId === a.id ? 'selected' : ''}>${esc(a.email)}</option>`).join('')}</select>
      <input class="input" style="max-width:220px" data-filter="repo" placeholder="Filter nama repo…" value="${esc(S.actFilter.repo)}" />
      <span class="spacer"></span><button class="btn sm" data-action="activity-filter">Terapkan</button>
    </div>
    <div class="table-wrap"><table class="tbl"><thead><tr><th>Waktu</th><th>Aksi</th><th>Dari</th><th>Ke</th><th>Akun</th><th>Status</th><th></th></tr></thead>
    <tbody>${entries.length ? entries.map((e) => `<tr>
      <td class="tiny mono">${fmtTime(e.ts)}<div class="faint">${timeAgo(e.ts)}</div></td>
      <td><span class="chip ${e.success ? 'info' : 'bad'}">${esc((OP[e.op] || { label: e.op }).label)}</span></td>
      <td class="mono tiny" style="max-width:220px"><div class="truncate" title="${esc(e.from?.label)}">${esc(e.from?.label || '—')}</div><div class="faint">${esc(e.from?.branch || '')}</div></td>
      <td class="mono tiny" style="max-width:220px"><div class="truncate" title="${esc(e.to?.label)}">${esc(e.to?.label || '—')}</div><div class="faint">${esc(e.to?.url ? shortUrl(e.to.url) : '')}</div></td>
      <td class="tiny">${esc(e.email || e.login || '—')}</td>
      <td><span class="dot ${e.success ? 'good' : 'bad'}"></span> <span class="tiny">${e.success ? 'ok' : 'gagal'}</span></td>
      <td><button class="btn sm icon" data-action="activity-detail" data-id="${esc(e.id)}" title="Detail">${ic('eye')}</button></td>
    </tr>`).join('') : `<tr><td colspan="7"><div class="empty">Belum ada operasi tercatat.</div></td></tr>`}</tbody></table></div></div>`;
}

/* ----------------------------- Parameters ----------------------------- */
function paramsHTML() {
  return `<div class="view-head"><div><div class="eyebrow">Konfigurasi</div><h1>Parameters</h1>
    <p>Semua pengaturan app, Git, OAuth, dan Arena AI — tersimpan di <code>data/config.json</code> (tidak masuk Git).</p></div>
    <div class="spacer"></div><div class="btn-group"><button class="btn" data-action="probe-paths">${ic('folder')} Cek path</button></div></div>
  <div id="param-body"></div>
  <div class="sticky-save"><span class="small muted" id="param-dirty">Tidak ada perubahan</span><span class="spacer"></span>
    <button class="btn sm" data-action="param-reset-all">${ic('refresh')} Reset semua</button>
    <button class="btn sm primary" data-action="param-save">${ic('check')} Simpan perubahan</button></div>`;
}

function paramInputHTML(f) {
  const dis = f.locked ? 'disabled' : '';
  const common = `data-param="${esc(f.path)}" ${dis}`;
  if (f.type === 'boolean') {
    return `<div class="switch-wrap"><div class="switch ${f.value ? 'on' : ''}" ${common} data-action="param-toggle" role="switch" tabindex="0"></div><span class="tiny muted">${f.value ? 'Aktif' : 'Nonaktif'}</span></div>`;
  }
  if (f.type === 'select') {
    return `<select class="input" ${common}>${f.options.map((o) => `<option value="${esc(o)}" ${o === f.value ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
  }
  if (f.type === 'number') {
    return `<input class="input" type="number" ${common} min="${f.min ?? ''}" max="${f.max ?? ''}" value="${esc(f.value)}" />`;
  }
  if (f.type === 'paths' || f.type === 'tags') {
    return `<textarea class="input" ${common} rows="${Math.min(Math.max((f.value || []).length + 1, 2), 6)}" placeholder="Satu per baris">${esc((f.value || []).join('\n'))}</textarea>`;
  }
  return `<input class="input ${f.path.includes('clientId') || f.path.includes('binary') ? 'mono' : ''}" ${common} value="${esc(f.value)}" />`;
}

function renderParamsBody() {
  const root = $('#param-body');
  if (!root) return;
  if (S.demo || !S.params) {
    root.innerHTML = `<div class="card pad"><div class="empty">${S.demo ? 'Parameter asli hanya tersedia setelah login GitHub.' : 'Memuat parameter…'}</div></div>
      ${oauthGuideHTML()}${securityHTML()}`;
    return;
  }
  const groups = new Map();
  for (const f of S.params.fields) {
    if (!groups.has(f.section)) groups.set(f.section, []);
    groups.get(f.section).push(f);
  }
  root.innerHTML = [...groups.entries()].map(([section, fields]) => `<div class="card param-group"><div class="card-head">${ic(section.includes('Arena') ? 'sparkles' : section.includes('Otentikasi') ? 'shield' : section.includes('Workspace') ? 'folder' : section.includes('Tampilan') ? 'sun' : 'sliders')}<h3>${esc(section)}</h3><span class="spacer"></span><small>${fields.length} parameter</small></div>
    <div class="card-body" style="padding-top:4px;padding-bottom:4px">
    ${fields.map((f) => `<div class="param-row">
      <div><div class="param-label">${esc(f.label)}
        <span class="chip ${f.source === 'env' ? 'warn' : f.source === 'file' ? 'accent' : ''}">${f.source === 'env' ? `env · ${esc(f.env)}` : f.source === 'file' ? 'custom' : 'default'}</span>
        ${f.restart ? '<span class="chip">perlu restart</span>' : ''}</div>
        <div class="param-desc">${esc(f.desc)}</div></div>
      <div class="param-input">${paramInputHTML(f)}</div>
      <div class="param-actions">${f.source === 'file' ? `<button class="btn sm icon" data-action="param-reset" data-path="${esc(f.path)}" title="Kembalikan ke default">${ic('refresh')}</button>` : ''}</div>
    </div>`).join('')}</div></div>`).join('') + oauthGuideHTML() + securityHTML() + `<div id="probe-result"></div>`;
  updateDirty();
}

function oauthGuideHTML() {
  const cfg = S.boot.config;
  return `<div class="card" style="margin-bottom:16px"><div class="card-head">${ic('github')}<h3>Login GitHub asli (Device Flow)</h3><span class="spacer"></span><span class="chip ${S.boot.oauthReady ? 'good' : 'warn'}">${S.boot.oauthReady ? 'Client ID aktif' : 'belum diatur'}</span></div>
    <div class="card-body grid g2"><div><ol class="steps-list">
      <li>Buat <a href="https://github.com/settings/developers" target="_blank" rel="noopener"><u>OAuth App</u></a> di akun GitHub kamu.</li>
      <li>Centang <b>Enable Device Flow</b> pada halaman aplikasi.</li>
      <li>Salin <b>Client ID</b> ke parameter <code>auth.clientId</code> di atas, atau set <code>GITHUB_CLIENT_ID</code> di <code>.env</code>.</li>
      <li>Login: app memberi kode → kamu approve di <code>github.com/login/device</code> → selesai.</li>
    </ol></div>
    <div><div class="kv"><span class="k">Scopes</span><span class="v">${esc(cfg.auth.scopes)}</span>
      <span class="k">Email diizinkan</span><span class="v">${cfg.auth.allowedEmails.length ? esc(cfg.auth.allowedEmails.join(', ')) : 'semua akun (multi-akun)'}</span>
      <span class="k">Lama sesi</span><span class="v">${cfg.auth.sessionDays} hari</span>
      <span class="k">PAT</span><span class="v">${cfg.auth.allowPat ? 'diizinkan (opsi darurat)' : 'dinonaktifkan'}</span></div>
      <p class="tiny faint" style="margin-top:12px">Token disimpan terenkripsi AES-256-GCM di <code>data/accounts.json</code> dengan kunci di <code>data/secret.key</code> / <code>APP_SECRET</code>. Tidak pernah ditulis ke URL remote maupun log.</p></div></div></div>`;
}

function securityHTML() {
  return `<div class="card" style="margin-bottom:16px"><div class="card-head">${ic('shield')}<h3>Akun & keamanan</h3><span class="spacer"></span><small>${(S.boot.accounts || []).length} akun tersimpan</small></div>
    <div class="card-body">${(S.boot.accounts || []).map((a) => `<div class="row" style="padding:8px 0;border-bottom:1px solid var(--border)">
      ${a.avatarUrl ? `<img class="avatar" src="${esc(a.avatarUrl)}" alt="" />` : `<span class="avatar fallback">${esc((a.login || '?')[0].toUpperCase())}</span>`}
      <div><b class="small">${esc(a.login)}</b><div class="tiny faint">${esc(a.email)} · ${esc(a.kind || 'oauth')} · ${timeAgo(a.lastUsedAt)}</div></div>
      <span class="spacer"></span>${a.id === S.boot.activeAccountId ? '<span class="chip good">aktif</span>' : ''}
      <button class="btn sm danger" data-action="remove-account" data-id="${esc(a.id)}">${ic('trash')}</button></div>`).join('')}
      <p class="tiny faint" style="margin-top:14px">Tips produksi: jalankan di <code>127.0.0.1</code>, atau aktifkan <code>APP_PIN</code> + reverse proxy bila perlu diakses dari LAN. Push/pull memakai kredensial akun aktif lewat <code>GIT_ASKPASS</code>.</p>
    </div></div>`;
}

function collectParams() {
  const out = {};
  if (!S.params) return out;
  for (const el of $$('[data-param]')) {
    const path = el.dataset.param;
    const f = S.params.fields.find((x) => x.path === path);
    if (!f || f.locked) continue;
    let v;
    if (f.type === 'boolean') v = el.classList.contains('on');
    else if (f.type === 'paths' || f.type === 'tags') v = el.value.split('\n').map((s) => s.trim()).filter(Boolean);
    else if (f.type === 'number') v = Number(el.value);
    else v = el.value.trim();
    if (JSON.stringify(v) !== JSON.stringify(f.value)) out[path] = v;
  }
  return out;
}
function updateDirty() {
  const el = $('#param-dirty');
  if (!el) return;
  const count = Object.keys(collectParams()).length;
  el.innerHTML = count ? `<b style="color:var(--warn)">${count} parameter belum disimpan</b>` : 'Tidak ada perubahan';
}

/* ----------------------------- Drawer ----------------------------- */
function renderDrawer() {
  const root = $('#drawer-root');
  if (!root) return;
  if (!S.drawer) { root.innerHTML = ''; syncBodyLock(); return; }
  const d = S.detail;
  root.innerHTML = `<div class="overlay" data-action="drawer-close"></div>
    <aside class="drawer"><div class="drawer-head">
      <span class="repo-glyph">${ic('repo')}</span>
      <div style="min-width:0"><h2 class="truncate">${esc(S.drawer.name || 'Repository')}</h2><small class="truncate">${esc(S.drawer.path)}</small></div>
      <span class="spacer"></span><button class="btn icon ghost" data-action="drawer-close">${ic('close')}</button></div>
      <div class="drawer-tabs">${[['overview', 'Ringkasan & aksi'], ['history', 'Riwayat commit'], ['branches', 'Branch & remote'], ['terminal', 'Terminal']].map(([k, l]) => `<button class="tab ${S.drawerTab === k ? 'active' : ''}" data-action="drawer-tab" data-tab="${k}">${l}</button>`).join('')}</div>
      <div class="drawer-body" id="drawer-body">${drawerBodyHTML()}</div></aside>`;
  syncBodyLock();
  if (S.drawerTab === 'terminal') scrollTerminal();
}

function syncBodyLock() {
  document.body.classList.toggle('modal-open', Boolean(S.drawer || S.modal));
}

function drawerBodyHTML() {
  if (!S.detail) return `<div class="stack">${Array.from({ length: 4 }, () => `<div class="skeleton" style="height:16px"></div>`).join('')}</div>`;
  const d = S.detail;
  if (S.drawerTab === 'history') {
    return `<div class="section-title">${d.commits?.length || 0} commit terakhir</div>
      ${(d.commits || []).map((c) => `<div class="commit-item"><span class="commit-sha">${esc(c.short)}</span>
        <div style="min-width:0"><div class="small">${esc(c.subject)} ${c.refs ? `<span class="chip accent">${esc(c.refs)}</span>` : ''}</div>
        <div class="tiny faint">${esc(c.author)} &lt;${esc(c.email)}&gt; · ${timeAgo(c.date)}</div></div></div>`).join('') || '<div class="empty">Belum ada commit.</div>'}`;
  }
  if (S.drawerTab === 'branches') {
    return `<div class="section-title">Branch</div>${(d.branches || []).map((b) => `<div class="row" style="padding:7px 0;border-bottom:1px solid var(--border)">
      ${ic('branch')}<span class="mono tiny">${esc(b.name)}</span>${b.current ? '<span class="chip good">HEAD</span>' : ''}<span class="spacer"></span><span class="tiny faint">${esc(b.upstream || '')}</span>
      ${b.current ? '' : `<button class="btn sm" data-action="quick-checkout" data-branch="${esc(b.name)}">Checkout</button>`}</div>`).join('')}
      <div class="section-title">Remote</div>${(d.remotes || []).map((r) => `<div class="card pad" style="margin-bottom:10px;padding:12px">
        <div class="row"><b class="small">${esc(r.name)}</b><span class="spacer"></span><button class="btn sm icon" data-action="copy" data-copy="${esc(r.pushUrl)}">${ic('copy')}</button></div>
        <div class="mono tiny" style="word-break:break-all;margin-top:6px">fetch: ${esc(r.fetchUrl)}</div>
        <div class="mono tiny" style="word-break:break-all">push&nbsp;: ${esc(r.pushUrl)}</div></div>`).join('') || '<div class="empty tiny">Belum ada remote.</div>'}`;
  }
  if (S.drawerTab === 'terminal') {
    return `<div class="row" style="margin-bottom:10px"><span class="tiny muted">Output perintah Git (live via SSE)</span><span class="spacer"></span><button class="btn sm" data-action="terminal-clear">${ic('trash')} Bersihkan</button></div>
      <div class="terminal" id="terminal">${terminalHTML()}</div>`;
  }
  const remotes = d.remotes?.length ? d.remotes : [{ name: 'origin', pushUrl: '', fetchUrl: '' }];
  const remoteOpts = remotes.map((r) => `<option value="${esc(r.name)}">${esc(r.name)} · ${esc(shortUrl(r.pushUrl)) || 'tanpa URL'}</option>`).join('');
  return `<div class="grid g2" style="margin-bottom:18px">
    <div class="card pad" style="padding:14px"><div class="tiny muted">Branch saat ini</div><div class="mono" style="font-size:15px;margin-top:4px">${esc(d.branch)}</div>
      <div class="tiny faint" style="margin-top:4px">upstream ${esc(d.upstream || 'belum ada')} · HEAD ${esc(d.head || '—')}</div></div>
    <div class="card pad" style="padding:14px"><div class="tiny muted">Status</div><div class="row wrap" style="margin-top:6px">
      <span class="chip ${d.dirty.total ? 'warn' : 'good'}">${d.dirty.total} berubah</span>
      <span class="chip ${d.ahead ? 'info' : ''}">↑ ${d.ahead} ahead</span><span class="chip ${d.behind ? 'warn' : ''}">↓ ${d.behind} behind</span></div>
      <div class="tiny faint" style="margin-top:6px">${esc(d.gitUser || 'user.name/email dari git config')}</div></div></div>
  <div class="section-title">Push · ke mana?</div>
  <div class="card pad" style="margin-bottom:14px">
    <div class="grid g2"><div class="field"><label>Remote</label><select class="input" data-field="pushRemote">${remoteOpts}</select></div>
      <div class="field"><label>Branch lokal</label><input class="input mono" data-field="pushBranch" value="${esc(d.branch)}" /></div>
      <div class="field"><label>Branch tujuan (opsional)</label><input class="input mono" data-field="pushTarget" placeholder="${esc(d.branch)}" /></div>
      <div class="field"><label>Opsi</label><div class="row" style="gap:14px;padding-top:6px">
        <label class="check"><input type="checkbox" data-field="pushUpstream" checked /> -u</label>
        <label class="check"><input type="checkbox" data-field="pushForce" /> force-with-lease</label></div></div></div>
    <div class="row" style="margin-top:12px"><span class="tiny faint">Tujuan: <span class="mono">${esc(shortUrl(remotes[0].pushUrl) || 'belum ada remote')}</span></span><span class="spacer"></span>
      <button class="btn sm primary" data-action="git-action" data-op="push">${ic('arrow-up')} Push sekarang</button></div></div>
  <div class="section-title">Pull · dari mana?</div>
  <div class="card pad" style="margin-bottom:14px">
    <div class="grid g2"><div class="field"><label>Remote</label><select class="input" data-field="pullRemote">${remoteOpts}</select></div>
      <div class="field"><label>Branch</label><input class="input mono" data-field="pullBranch" value="${esc(d.branch)}" /></div></div>
    <div class="row" style="margin-top:12px"><span class="chip info">strategi: ${esc(S.boot.config.git.pullStrategy)}</span><span class="spacer"></span>
      <button class="btn sm" data-action="git-action" data-op="fetch">${ic('refresh')} Fetch</button>
      <button class="btn sm primary" data-action="git-action" data-op="pull">${ic('arrow-down')} Pull</button></div></div>
  <div class="section-title">Commit · atas nama ${esc(S.boot.account?.email || 'akun aktif')}</div>
  <div class="card pad" style="margin-bottom:14px">
    <div class="field"><label>Pesan commit</label><textarea class="input" data-field="commitMessage" placeholder="feat: …">${esc(commitTemplate())}</textarea></div>
    <div class="row" style="margin-top:10px"><span class="tiny faint">git add -A lalu commit dengan email akun aktif</span><span class="spacer"></span>
      <button class="btn sm primary" data-action="git-action" data-op="commit">${ic('git')} Commit</button></div></div>
  <div class="section-title">Branch & remote</div>
  <div class="card pad"><div class="grid g2">
    <div class="field"><label>Branch baru</label><input class="input mono" data-field="newBranch" placeholder="fitur-baru" /></div>
    <div class="field"><label>Checkout ke</label><input class="input mono" data-field="checkoutBranch" placeholder="${esc(d.branch)}" /></div>
    <div class="field"><label>Nama remote</label><input class="input mono" data-field="remoteName" value="origin" /></div>
    <div class="field"><label>URL remote</label><input class="input mono" data-field="remoteUrl" placeholder="https://github.com/user/repo.git" /></div></div>
    <div class="row wrap" style="margin-top:12px">
      <label class="check"><input type="checkbox" data-field="useArenaPrefix" checked /> prefix ${esc(S.boot.config.arena.branchPrefix)}</label>
      <span class="spacer"></span>
      <button class="btn sm" data-action="git-action" data-op="branch">${ic('branch')} Buat branch</button>
      <button class="btn sm" data-action="git-action" data-op="checkout">Checkout</button>
      <button class="btn sm" data-action="git-action" data-op="remote">${ic('link')} Set remote</button></div></div>`;
}

function commitTemplate() {
  const cfg = S.boot.config;
  const d = S.detail || {};
  return String(cfg.arena.commitTemplate || 'chore: sync {repo}')
    .replaceAll('{session}', cfg.arena.sessionLabel)
    .replaceAll('{repo}', d.name || 'repo')
    .replaceAll('{branch}', d.branch || 'main')
    .replaceAll('{date}', new Date().toISOString().slice(0, 10));
}

function terminalHTML() {
  if (!S.terminal.length) return `<span class="dim"># Belum ada perintah. Jalankan aksi Git dari tab Ringkasan & aksi.</span>\n`;
  return S.terminal.map((l) => `<span class="${l.kind || ''}">${esc(l.text)}</span>`).join('');
}
function pushTerminal(kind, text) {
  if (!text) return;
  S.terminal.push({ kind, text });
  if (S.terminal.length > 400) S.terminal.splice(0, S.terminal.length - 400);
  const el = $('#terminal');
  if (el) { el.insertAdjacentHTML('beforeend', `<span class="${kind || ''}">${esc(text)}</span>`); scrollTerminal(); }
}
function scrollTerminal() { const el = $('#terminal'); if (el) el.scrollTop = el.scrollHeight; }

/* ----------------------------- Modal ----------------------------- */
function renderModal() {
  const root = $('#modal-root');
  if (!root) return;
  if (!S.modal) { root.innerHTML = ''; syncBodyLock(); return; }
  const m = S.modal;
  let title = ''; let body = ''; let foot = ''; let wide = '';
  if (m.kind === 'clone' || m.kind === 'init') {
    const isClone = m.kind === 'clone';
    title = isClone ? 'Clone repository' : 'Init repository baru';
    body = `<div class="stack">
      ${isClone ? `<div class="field"><label>URL repository</label><input class="input mono" data-field="url" placeholder="https://github.com/user/repo.git" value="${esc(m.url || '')}" /></div>` : `<div class="field"><label>URL remote (opsional)</label><input class="input mono" data-field="url" placeholder="https://github.com/user/repo.git" /></div>`}
      <div class="grid g2"><div class="field"><label>Nama folder</label><input class="input mono" data-field="name" value="${esc(m.name || '')}" placeholder="nama-project" /></div>
      <div class="field"><label>Root tujuan</label><select class="input" data-field="root">${(S.boot.config.workspace.roots || []).map((r) => `<option value="${esc(r)}">${esc(r)}</option>`).join('')}</select></div></div>
      <div class="field"><label>Branch (opsional)</label><input class="input mono" data-field="branch" placeholder="${esc(S.boot.config.git.defaultBranch)}" value="${esc(m.branch || '')}" /></div>
      <p class="tiny faint">Path hasil: <code>${esc(S.boot.config.workspace.roots[0] || '')}/&lt;nama folder&gt;</code>. Hanya folder di dalam root project yang diizinkan.</p></div>`;
    foot = `<button class="btn" data-action="modal-close">Batal</button><button class="btn primary" data-action="${isClone ? 'clone-submit' : 'init-submit'}">${ic(isClone ? 'download' : 'plus')} ${isClone ? 'Clone' : 'Buat repo'}</button>`;
  } else if (m.kind === 'create') {
    title = 'Buat repository di GitHub';
    body = `<div class="stack"><div class="field"><label>Nama repository</label><input class="input mono" data-field="ghName" placeholder="project-baru" /></div>
      <div class="field"><label>Deskripsi</label><input class="input" data-field="ghDesc" placeholder="Deskripsi singkat" /></div>
      <div class="grid g2"><div class="field"><label>Visibilitas</label><select class="input" data-field="ghPrivate"><option value="false">Public</option><option value="true">Private</option></select></div>
      <div class="field"><label>Gitignore template</label><input class="input mono" data-field="ghGitignore" placeholder="Node (opsional)" /></div></div>
      <label class="check"><input type="checkbox" data-field="ghAutoInit" checked /> Buat README otomatis</label>
      <p class="tiny faint">Dibuat atas nama <b>${esc(S.boot.account?.email)}</b> lewat GitHub API. Setelah itu kamu bisa langsung clone ke root project.</p></div>`;
    foot = `<button class="btn" data-action="modal-close">Batal</button><button class="btn primary" data-action="gh-create-submit">${ic('plus')} Buat repository</button>`;
  } else if (m.kind === 'activity-detail') {
    const e = m.entry || {};
    title = `Detail · ${(OP[e.op] || { label: e.op }).label}`;
    wide = 'wide';
    body = `<div class="kv"><span class="k">Waktu</span><span class="v">${fmtTime(e.ts)}</span>
      <span class="k">Repo</span><span class="v">${esc(e.repo?.name || '')} ${esc(e.repo?.path || '')}</span>
      <span class="k">Dari</span><span class="v">${esc(e.from?.label || '—')}</span>
      <span class="k">Ke</span><span class="v">${esc(e.to?.label || '—')}</span>
      <span class="k">Akun</span><span class="v">${esc(e.email || '')}</span>
      <span class="k">Perintah</span><span class="v">${esc(e.command || '')}</span>
      <span class="k">Durasi</span><span class="v">${e.durationMs} ms · exit ${e.exitCode}</span></div>
      <div class="section-title">Output</div><div class="terminal" style="height:220px">${esc(e.output || '(tanpa output)')}</div>`;
    foot = `<button class="btn" data-action="modal-close">Tutup</button>`;
  } else if (m.kind === 'add-account') {
    title = 'Tambah akun GitHub';
    body = S.flow && S.flowHost === 'modal' ? flowCardHTML() : `<div class="empty">Menyiapkan kode login…</div>`;
    foot = `<button class="btn" data-action="modal-close">Tutup</button>`;
  }
  root.innerHTML = `<div class="modal-wrap"><div class="overlay" data-action="modal-close"></div>
    <div class="modal ${wide}"><div class="modal-head">${ic('sparkles')}<h2>${esc(title)}</h2><span class="spacer"></span><button class="btn icon ghost" data-action="modal-close">${ic('close')}</button></div>
    <div class="modal-body" id="modal-body">${body}</div><div class="modal-foot">${foot}</div></div></div>`;
  syncBodyLock();
}

/* ----------------------------- Aksi Git ----------------------------- */
async function doGit(action, params) {
  const path = params.path || '';
  try {
    const d = await api('/api/git', { method: 'POST', body: { action, params } });
    const r = d.result;
    pushTerminal('cmd', `\n$ ${d.entry.command || action}\n`);
    if (r.output) pushTerminal(r.ok ? '' : 'err', r.output.endsWith('\n') ? r.output : r.output + '\n');
    toast(r.ok ? `${(OP[action] || { label: action }).label} berhasil` : `${(OP[action] || { label: action }).label} gagal`, d.entry.summary || r.output?.slice(0, 140), r.ok ? 'good' : 'bad');
    await Promise.allSettled([loadRepos(true), loadActivity()]);
    if (S.drawer) await refreshDetail();
    return Boolean(r.ok);
  } catch (error) {
    pushTerminal('err', `\n${error.message}\n`);
    toast('Gagal menjalankan perintah', error.message, 'bad');
    return false;
  }
}

async function openRepo(repoPath) {
  S.drawer = { path: repoPath, name: repoPath.split('/').pop() };
  S.drawerTab = 'overview';
  S.terminal = [];
  S.detail = null;
  renderDrawer();
  await refreshDetail();
}

async function refreshDetail() {
  if (!S.drawer) return;
  if (S.demo) {
    S.detail = { ...(DEMO_REPOS.find((r) => r.path === S.drawer.path) || DEMO_REPOS[0]), commits: [], branches: [{ name: 'main', current: true, upstream: 'origin/main' }], diffStat: '', gitUser: '' };
    renderDrawer(); return;
  }
  try {
    const d = await api(`/api/repos/detail?path=${encodeURIComponent(S.drawer.path)}`);
    S.detail = d.repo;
    S.drawer.name = d.repo.name;
    renderDrawer();
  } catch (error) { toast('Gagal memuat detail', error.message, 'bad'); }
}

function drawerParams(op) {
  const root = $('#drawer-root');
  const d = S.detail || {};
  const base = { path: S.drawer?.path || '' };
  switch (op) {
    case 'push': return { ...base, remote: val('pushRemote', root) || d.remotes?.[0]?.name, branch: val('pushBranch', root) || d.branch, targetBranch: val('pushTarget', root) || undefined, force: checked('pushForce', root), setUpstream: checked('pushUpstream', root) };
    case 'pull': return { ...base, remote: val('pullRemote', root) || d.remotes?.[0]?.name, branch: val('pullBranch', root) || d.branch };
    case 'fetch': return { ...base, remote: val('pullRemote', root) || d.remotes?.[0]?.name };
    case 'commit': return { ...base, message: val('commitMessage', root) };
    case 'branch': return { ...base, newBranch: val('newBranch', root), useArenaPrefix: checked('useArenaPrefix', root) };
    case 'checkout': return { ...base, target: val('checkoutBranch', root) };
    case 'remote': return { ...base, remote: val('remoteName', root), url: val('remoteUrl', root), mode: 'set-url' };
    default: return base;
  }
}

/* ----------------------------- Device flow ----------------------------- */
function clearFlowTimers() {
  if (S.flowTimer) { clearTimeout(S.flowTimer); S.flowTimer = null; }
  if (S.tickTimer) { clearInterval(S.tickTimer); S.tickTimer = null; }
}

async function startFlow(host = 'login') {
  clearFlowTimers();
  try {
    const d = await api('/api/auth/device/start', { method: 'POST', body: {} });
    S.flow = { ...d.flow, startedAt: Date.now(), host, status: 'pending', message: 'Menunggu persetujuan di GitHub…', done: false };
    S.flowHost = host;
    if (host === 'modal') { S.modal = { kind: 'add-account' }; renderModal(); }
    else render();
    startCountdown();
    schedulePoll((d.flow.interval || 5) * 1000);
  } catch (error) {
    toast('Gagal memulai login', error.message, 'bad');
    if (host === 'modal') S.modal = null;
    render();
  }
}

function startCountdown() {
  const tick = () => {
    if (!S.flow || S.flow.done) return;
    const left = Math.max(0, S.flow.expiresIn - Math.floor((Date.now() - S.flow.startedAt) / 1000));
    const el = $('#flow-countdown');
    if (el) el.textContent = `${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`;
    const bar = $('#flow-progress');
    if (bar) bar.style.width = `${(left / S.flow.expiresIn) * 100}%`;
    if (left <= 0) { S.flow.done = true; S.flow.status = 'expired'; S.flow.message = 'Kode kedaluwarsa. Mulai ulang login.'; renderFlowHost(); }
  };
  S.tickTimer = setInterval(tick, 1000);
  tick();
}

function renderFlowHost() {
  if (S.flowHost === 'modal') renderModal(); else render();
}

function schedulePoll(delay) {
  clearTimeout(S.flowTimer);
  S.flowTimer = setTimeout(pollFlow, Math.max(1500, delay));
}

async function pollFlow() {
  if (!S.flow || S.flow.done) return;
  try {
    const d = await api('/api/auth/device/poll', { method: 'POST', body: { flowId: S.flow.flowId } });
    if (d.status === 'success') {
      clearFlowTimers();
      setToken(d.sessionToken);
      S.flow = null; S.modal = null; S.dropdown = false;
      await bootstrap();
      S.view = 'dashboard';
      render();
      await loadAll();
      toast('Login berhasil', `Masuk sebagai ${S.boot.account?.email}`, 'good');
      return;
    }
    if (['expired', 'denied', 'error'].includes(d.status)) {
      clearFlowTimers();
      S.flow.done = true; S.flow.status = d.status; S.flow.message = d.message || 'Login gagal.';
      renderFlowHost();
      return;
    }
    const status = $('#flow-status');
    if (status) status.textContent = d.status === 'slow_down' ? 'GitHub meminta jeda sebentar…' : 'Menunggu persetujuan di GitHub…';
    schedulePoll((d.retryIn || S.flow.interval || 5) * 1000 + 300);
  } catch (error) {
    clearFlowTimers();
    if (S.flow) { S.flow.done = true; S.flow.status = 'error'; S.flow.message = error.message; renderFlowHost(); }
    toast('Login gagal', error.message, 'bad');
  }
}

function cancelFlow() {
  clearFlowTimers();
  if (S.flow?.flowId) api('/api/auth/device/cancel', { method: 'POST', body: { flowId: S.flow.flowId } }).catch(() => {});
  S.flow = null;
  if (S.flowHost === 'modal') { S.modal = null; renderModal(); }
  else render();
}

/* ----------------------------- Event handling ----------------------------- */
document.addEventListener('click', async (event) => {
  const trigger = event.target.closest('[data-action]');
  if (S.dropdown && !event.target.closest('.account-menu') && trigger?.dataset.action !== 'account-menu') {
    S.dropdown = false; renderDropdown();
  }
  if (!trigger) return;
  const action = trigger.dataset.action;

  switch (action) {
    case 'nav':
      S.view = trigger.dataset.view; S.dropdown = false; render();
      if (!S.demo && !S.repos) loadAll();
      break;
    case 'theme-toggle': {
      S.theme = S.theme === 'light' ? 'dark' : 'light';
      applyTheme();
      if (S.boot) S.boot.config.ui.theme = S.theme;
      render();
      if (!S.demo) api('/api/config', { method: 'PUT', body: { values: { 'ui.theme': S.theme } } }).catch(() => {});
      break;
    }
    case 'refresh-all': toast('Memuat ulang', 'Mengambil data terbaru dari Git & GitHub…'); await loadAll(true); break;
    case 'refresh-gh': await loadGithub(); break;
    case 'scan-repos': toast('Memindai', 'Mencari repository di root project…'); await loadRepos(true); break;
    case 'account-menu': S.dropdown = !S.dropdown; renderDropdown(); break;
    case 'switch-account': {
      try {
        const d = await api('/api/auth/switch', { method: 'POST', body: { accountId: trigger.dataset.id } });
        setToken(d.sessionToken); S.dropdown = false;
        await bootstrap(); render(); await loadAll(true);
        toast('Akun diganti', `Sekarang ${S.boot.account?.email}`);
      } catch (error) { toast('Gagal ganti akun', error.message, 'bad'); }
      break;
    }
    case 'add-account': S.dropdown = false; renderDropdown(); await startFlow('modal'); break;
    case 'logout': {
      try { await api('/api/auth/logout', { method: 'POST', body: {} }); } catch { /* ignore */ }
      setToken(''); if (S.es) { S.es.close(); S.es = null; }
      S.dropdown = false; S.demo = false;
      await bootstrap(); render(); toast('Keluar', 'Sesi GitHub dihapus.');
      break;
    }
    case 'remove-account': {
      if (!confirm('Hapus akun & token tersimpan dari komputer ini?')) break;
      try {
        const d = await api(`/api/accounts/${encodeURIComponent(trigger.dataset.id)}`, { method: 'DELETE' });
        if (d.loggedOut) setToken('');
        await bootstrap(); render(); toast('Akun dihapus', 'Token ikut dihapus.');
      } catch (error) { toast('Gagal', error.message, 'bad'); }
      break;
    }
    case 'enter-demo': enterDemo(); break;
    case 'demo-exit':
      S.demo = false; setToken(''); await bootstrap(); render(); break;
    case 'pin-submit': {
      S.pin = val('pin');
      LS.set('ghc.pin', S.pin);
      try { await bootstrap(); render(); if (S.boot.authenticated) { await loadAll(); connectSSE(); } }
      catch (error) { toast('PIN ditolak', error.message, 'bad'); }
      break;
    }
    case 'save-client-id': {
      const clientId = val('clientId');
      if (!clientId) { toast('Client ID kosong', 'Isi dulu kolomnya.', 'warn'); break; }
      try {
        const d = await api('/api/config', { method: 'PUT', body: { values: { 'auth.clientId': clientId } } });
        S.boot.config = d.config; S.boot.oauthReady = Boolean(d.config.auth.clientId);
        render(); toast('Client ID tersimpan', 'Sekarang bisa login dengan GitHub.');
      } catch (error) { toast('Gagal menyimpan', error.message, 'bad'); }
      break;
    }
    case 'login-start': await startFlow('login'); break;
    case 'login-retry': S.flow = null; await startFlow(S.flowHost || 'login'); break;
    case 'login-cancel': cancelFlow(); break;
    case 'pat-login': {
      const token = val('pat');
      if (!token) { toast('Token kosong', 'Isi token dulu.', 'warn'); break; }
      try {
        const d = await api('/api/auth/pat', { method: 'POST', body: { token } });
        setToken(d.sessionToken); await bootstrap(); render(); await loadAll();
        toast('Login berhasil', d.account.email);
      } catch (error) { toast('Login gagal', error.message, 'bad'); }
      break;
    }
    case 'copy': await copyText(trigger.dataset.copy || ''); break;
    case 'copy-context': await copyText(S.context?.text || ''); break;
    case 'template-commit': {
      const el = $('[data-field="commitMessage"]', $('#drawer-root'));
      if (el) el.value = commitTemplate();
      toast('Template dipakai', 'Pesan commit diisi dari parameter Arena AI.');
      break;
    }
    case 'repo-filter': S.repoFilter = trigger.dataset.filter; renderView(); break;
    case 'gh-filter': S.ghFilter = trigger.dataset.filter; renderView(); break;
    case 'repo-open': await openRepo(trigger.dataset.path); break;
    case 'quick-op': {
      const op = trigger.dataset.op;
      if (op === 'commit') { await openRepo(trigger.dataset.path); break; }
      trigger.classList.add('loading');
      await doGit(op, { path: trigger.dataset.path });
      trigger.classList.remove('loading');
      break;
    }
    case 'fetch-all': {
      const repos = (S.repos || []).slice(0, 12);
      if (!repos.length) { toast('Tidak ada repo', 'Pindai dulu workspace.', 'warn'); break; }
      toast('Fetch semua', `${repos.length} repository…`);
      for (const r of repos) await doGit('fetch', { path: r.path });
      break;
    }
    case 'drawer-close': S.drawer = null; S.detail = null; renderDrawer(); break;
    case 'drawer-tab': S.drawerTab = trigger.dataset.tab; renderDrawer(); break;
    case 'terminal-clear': S.terminal = []; renderDrawer(); break;
    case 'git-action': {
      const op = trigger.dataset.op;
      const params = drawerParams(op);
      if ((op === 'commit' && !params.message) || (op === 'branch' && !params.newBranch) || (op === 'checkout' && !params.target) || (op === 'remote' && !params.url)) {
        toast('Lengkapi dulu', 'Ada kolom wajib yang masih kosong.', 'warn'); break;
      }
      trigger.classList.add('loading');
      await doGit(op, params);
      trigger.classList.remove('loading');
      break;
    }
    case 'quick-checkout': await doGit('checkout', { path: S.drawer?.path, target: trigger.dataset.branch }); break;
    case 'clone-open': S.modal = { kind: 'clone' }; renderModal(); break;
    case 'init-open': S.modal = { kind: 'init' }; renderModal(); break;
    case 'modal-close': S.modal = null; clearFlowTimers(); S.flow = null; renderModal(); break;
    case 'clone-submit':
    case 'init-submit': {
      const root = $('#modal-root');
      const params = { url: val('url', root), name: val('name', root), root: val('root', root), branch: val('branch', root) };
      if (!params.name || (action === 'clone-submit' && !params.url)) { toast('Lengkapi dulu', 'Nama folder (dan URL untuk clone) wajib diisi.', 'warn'); break; }
      const okDone = await doGit(action === 'clone-submit' ? 'clone' : 'init', params);
      if (okDone) { S.modal = null; renderModal(); }
      break;
    }
    case 'gh-create-open': S.modal = { kind: 'create' }; renderModal(); break;
    case 'gh-create-submit': {
      const root = $('#modal-root');
      const name = val('ghName', root);
      if (!name) { toast('Nama wajib', 'Isi nama repository.', 'warn'); break; }
      try {
        const d = await api('/api/github/repos', { method: 'POST', body: {
          name, description: val('ghDesc', root), private: val('ghPrivate', root) === 'true',
          autoInit: checked('ghAutoInit', root), gitignore: val('ghGitignore', root) || undefined,
        } });
        toast('Repository dibuat', d.repo?.full_name || name);
        await Promise.allSettled([loadGithub(), loadActivity()]);
        S.modal = { kind: 'clone', url: d.repo?.clone_url || '', name, branch: d.repo?.default_branch || '' };
        renderModal();
      } catch (error) { toast('Gagal membuat repo', error.message, 'bad'); }
      break;
    }
    case 'gh-clone': S.modal = { kind: 'clone', url: trigger.dataset.url, name: trigger.dataset.name }; renderModal(); break;
    case 'gh-archive': {
      const full = trigger.dataset.full;
      const archived = trigger.dataset.archived === '1';
      if (!confirm(`${archived ? 'Buka arsip' : 'Arsipkan'} repository ${full}?`)) break;
      try {
        await api(`/api/github/repos/${full}`, { method: 'PATCH', body: { archived: !archived } });
        toast(archived ? 'Arsip dibuka' : 'Diarsipkan', full);
        await Promise.allSettled([loadGithub(), loadActivity()]);
      } catch (error) { toast('Gagal', error.message, 'bad'); }
      break;
    }
    case 'activity-detail': {
      const entry = (S.activity.entries || []).find((e) => e.id === trigger.dataset.id);
      if (entry) { S.modal = { kind: 'activity-detail', entry }; renderModal(); }
      break;
    }
    case 'activity-filter': {
      S.actFilter.op = $('[data-filter="op"]')?.value || '';
      S.actFilter.accountId = $('[data-filter="accountId"]')?.value || '';
      S.actFilter.repo = $('[data-filter="repo"]')?.value || '';
      await loadActivity();
      break;
    }
    case 'activity-export': {
      const st = S.activity.stats || {};
      const text = [
        `# Ringkasan alur Git — ${new Date().toLocaleString('id-ID')}`,
        `Total ${st.total || 0} operasi · ${st.success || 0} berhasil · ${st.failed || 0} gagal`,
        `Push ${st.pushes || 0} · Pull/fetch ${st.pulls || 0}`, '',
        'Tujuan push:', ...(st.destinations || []).map((d) => `- ${d.key} (${d.count}x)`), '',
        'Sumber pull:', ...(st.origins || []).map((d) => `- ${d.key} (${d.count}x)`),
      ].join('\n');
      await copyText(text);
      break;
    }
    case 'activity-clear': {
      if (!confirm('Kosongkan seluruh riwayat aktivitas Git?')) break;
      try { await api('/api/activity', { method: 'DELETE' }); await loadActivity(); toast('Riwayat dikosongkan'); }
      catch (error) { toast('Gagal', error.message, 'bad'); }
      break;
    }
    case 'param-toggle': {
      if (trigger.classList.contains('switch')) {
        trigger.classList.toggle('on');
        const label = trigger.nextElementSibling;
        if (label) label.textContent = trigger.classList.contains('on') ? 'Aktif' : 'Nonaktif';
        updateDirty();
      }
      break;
    }
    case 'param-save': {
      const values = collectParams();
      if (!Object.keys(values).length) { toast('Tidak ada perubahan', 'Semua parameter sudah tersimpan.', 'warn'); break; }
      try {
        const d = await api('/api/config', { method: 'PUT', body: { values } });
        S.boot.config = d.config; S.params.fields = d.fields;
        S.theme = d.config.ui.theme; S.accent = d.config.ui.accent;
        applyTheme(); render(); toast('Parameter tersimpan', `${Object.keys(values).length} pengaturan diperbarui.`);
        await loadAll(true);
      } catch (error) { toast('Gagal menyimpan', error.message, 'bad'); }
      break;
    }
    case 'param-reset': {
      const key = trigger.dataset.path;
      try {
        const d = await api('/api/config/reset', { method: 'POST', body: { keys: [key] } });
        S.boot.config = d.config; S.params.fields = d.fields; renderView();
        toast('Dikembalikan', `${key} kembali ke nilai default.`);
      } catch (error) { toast('Gagal', error.message, 'bad'); }
      break;
    }
    case 'param-reset-all': {
      if (!confirm('Kembalikan semua parameter ke default (kecuali yang dikunci env)?')) break;
      try {
        const d = await api('/api/config/reset', { method: 'POST', body: { keys: [] } });
        S.boot.config = d.config; S.params.fields = d.fields;
        S.theme = d.config.ui.theme; S.accent = d.config.ui.accent;
        applyTheme(); render(); toast('Semua parameter direset');
      } catch (error) { toast('Gagal', error.message, 'bad'); }
      break;
    }
    case 'probe-paths': {
      try {
        const roots = S.boot.config.workspace.roots || [];
        const results = await Promise.all(roots.map(async (p) => {
          const d = await api('/api/environment/probe', { method: 'POST', body: { path: p } });
          return d.probe;
        }));
        const el = $('#probe-result');
        if (el) el.innerHTML = `<div class="card pad"><div class="section-title">Hasil pengecekan path</div>${results.map((r) => `<div class="row" style="padding:5px 0"><span class="dot ${r.exists && r.isDir && r.insideRoots ? 'good' : 'bad'}"></span><span class="mono tiny">${esc(r.path)}</span><span class="spacer"></span><span class="chip ${r.exists && r.isDir && r.insideRoots ? 'good' : 'bad'}">${r.exists ? (r.isDir ? 'folder' : 'bukan folder') : 'tidak ada'}</span></div>`).join('')}</div>`;
        toast('Path dicek', `${results.length} root diperiksa.`);
      } catch (error) { toast('Gagal cek path', error.message, 'bad'); }
      break;
    }
    default: break;
  }
});

document.addEventListener('input', (event) => {
  const el = event.target;
  if (el.dataset.search === 'repos') { S.search = el.value; renderRepoList(); }
  if (el.dataset.search === 'gh') { S.ghSearch = el.value; renderGhList(); }
  if (el.dataset.param) updateDirty();
});
document.addEventListener('change', (event) => {
  if (event.target.dataset.param) updateDirty();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    if (S.modal) { S.modal = null; clearFlowTimers(); S.flow = null; renderModal(); }
    else if (S.drawer) { S.drawer = null; renderDrawer(); }
    else if (S.dropdown) { S.dropdown = false; renderDropdown(); }
  }
  if (event.key === 'Enter' && event.target.dataset?.field === 'pin') {
    $('[data-action="pin-submit"]')?.click();
  }
});

/* ----------------------------- Init ----------------------------- */
(async function init() {
  try {
    await bootstrap();
    render();
    if (S.boot.authenticated && S.boot.pinOk && !S.demo) await loadAll();
  } catch (error) {
    $('#app').innerHTML = `<div class="boot-screen"><div class="boot-logo">!</div><div class="boot-title">Gagal terhubung ke server</div><div class="boot-sub">${esc(error.message)}</div><div class="tiny faint" style="margin-top:12px">Jalankan <code>npm start</code> lalu muat ulang halaman.</div></div>`;
  }
})();
