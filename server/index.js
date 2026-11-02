'use strict';

/** Entry point server HTTP lokal (tanpa framework, tanpa dependency). */
import http from 'node:http';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PROJECT_ROOT, DATA_DIR, loadConfig, ensureDataDir } from './lib/config.js';
import { sessions, accounts } from './lib/store.js';
import * as git from './lib/git.js';
import { EventBus } from './lib/util.js';
import { handleApi, handleWebhook, apiFail } from './api.js';
import { startScheduler, stopScheduler } from './lib/automation.js';

const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public');
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
};

const bus = new EventBus();

async function serveStatic(req, res, pathname) {
  const relative = pathname === '/' ? 'index.html' : decodeURIComponent(pathname).replace(/^\/+/, '');
  const filePath = path.resolve(PUBLIC_DIR, relative);
  if (!filePath.startsWith(PUBLIC_DIR + path.sep) && filePath !== path.join(PUBLIC_DIR, 'index.html')) {
    res.writeHead(403); res.end('Forbidden'); return;
  }
  let stat;
  try { stat = await fsp.stat(filePath); } catch {
    if (!path.extname(filePath)) {
      // SPA fallback
      const html = await fsp.readFile(path.join(PUBLIC_DIR, 'index.html'));
      res.writeHead(200, { 'Content-Type': MIME['.html'], 'Cache-Control': 'no-store' });
      res.end(html);
      return;
    }
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Tidak ditemukan');
    return;
  }
  if (!stat.isFile()) { res.writeHead(404); res.end('Tidak ditemukan'); return; }
  const ext = path.extname(filePath).toLowerCase();
  const etag = `"${stat.size.toString(16)}-${Math.floor(stat.mtimeMs).toString(16)}"`;
  // HTML/JS/CSS selalu revalidasi: perbaikan UI langsung terlihat tanpa hard refresh.
  const cacheControl = (ext === '.html' || ext === '.js' || ext === '.css') ? 'no-cache' : 'public, max-age=60';
  const headers = {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Content-Length': stat.size,
    'Cache-Control': cacheControl,
    'ETag': etag,
    'Last-Modified': stat.mtime.toUTCString(),
  };
  const ims = req.headers['if-modified-since'];
  if (req.headers['if-none-match'] === etag || (!req.headers['if-none-match'] && ims && ims === headers['Last-Modified'])) {
    res.writeHead(304, { 'ETag': etag, 'Cache-Control': cacheControl, 'Last-Modified': headers['Last-Modified'] });
    res.end();
    return;
  }
  res.writeHead(200, headers);
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers['x-forwarded-host'] || req.headers.host || 'localhost'}`);
  // Header ramah preview/iframe: tidak ada X-Frame-Options, tidak ada host allowlist.
  // ACAO hanya diberikan kalau Origin cocok dengan host permintaan; tanpa ACAO,
  // permintaan same-origin (kasus normal lewat proxy) tetap bekerja.
  const origin = req.headers.origin;
  const host = req.headers['x-forwarded-host'] || req.headers.host || '';
  if (origin) {
    try {
      const o = new URL(origin);
      const h = new URL(`http://${host}`);
      if (o.host === h.host || o.hostname === h.hostname) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Vary', 'Origin');
      }
    } catch { /* origin tidak valid: abaikan */ }
  }
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-App-Pin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // Webhook publik dari GitHub (verifikasi HMAC, bukan sesi browser).
  if (url.pathname === '/webhook/github') {
    try { await handleWebhook(req, res, bus); }
    catch (error) { if (!res.headersSent) apiFail(res, error); else { try { res.end(); } catch { /* ignore */ } } }
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    try {
      const outcome = await handleApi(req, res, url, bus);
      if (outcome === null) return; // SSE masih terbuka
    } catch (error) {
      if (!res.headersSent) apiFail(res, error);
      else { try { res.end(); } catch { /* ignore */ } }
    }
    return;
  }

  try { await serveStatic(req, res, url.pathname); }
  catch (error) { res.writeHead(500); res.end(String(error.message)); }
});

async function main() {
  await ensureDataDir();
  git.ensureAskpass();
  await sessions.purge();
  const cfg = loadConfig();
  const env = await git.environment(cfg);
  const port = Number(process.env.PORT || cfg.server.port || 4173);
  const host = process.env.HOST || cfg.server.host || '127.0.0.1';
  const accountCount = accounts.count();

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`\n  ✗ Port ${port} sedang dipakai proses lain (biasanya sisa 'npm start' sebelumnya).`);
      console.error('    Matikan proses lama dengan Ctrl+C di terminalnya, atau hentikan paksa:');
      console.error(`      PowerShell : Get-NetTCPConnection -LocalPort ${port} | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }`);
      console.error('      cmd        : taskkill /F /IM node.exe');
      console.error('    Atau pakai port lain:');
      console.error(`      PowerShell : $env:PORT=${port + 1}; npm start`);
      console.error(`      cmd        : set PORT=${port + 1} && npm start\n`);
      process.exit(1);
    }
    console.error('\n  ✗ Server gagal dijalankan:', error.message, '\n');
    process.exit(1);
  });

  startScheduler(bus);

  server.listen(port, host, () => {
    const shownHost = host === '0.0.0.0' ? 'localhost' : host;
    console.log('');
    console.log('  ┌───────────────────────────────────────────────────────┐');
    console.log('  │  ✦ GitHub Changer — dashboard Git & GitHub lokal      │');
    console.log('  └───────────────────────────────────────────────────────┘');
    console.log(`  ▶ URL         : http://${shownHost}:${port}`);
    console.log(`  ▶ Git         : ${env.git.ok ? `${env.git.path} · ${env.git.version}` : `TIDAK DITEMUKAN (${env.git.error})`}`);
    console.log(`  ▶ GitHub CLI  : ${env.gh.ok ? env.gh.version : 'tidak terinstal (opsional)'}`);
    console.log(`  ▶ Root project: ${cfg.workspace.roots.join(', ')}`);
    console.log(`  ▶ Data        : ${DATA_DIR} (token terenkripsi, tidak masuk Git)`);
    console.log(`  ▶ OAuth       : ${cfg.auth.clientId ? `Client ID ${cfg.auth.clientId.slice(0, 8)}… siap` : 'BELUM diatur → isi di halaman Parameters / GITHUB_CLIENT_ID'}`);
    console.log(`  ▶ Akun tersimpan: ${accountCount}`);
    console.log('');
  });
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    console.log(`\n[${signal}] Menutup server…`);
    stopScheduler();
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 2000).unref();
  });
}

main().catch((error) => {
  console.error('Gagal menjalankan server:', error);
  process.exit(1);
});

export { server };
