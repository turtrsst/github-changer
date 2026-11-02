#!/usr/bin/env node
'use strict';

/** Pemeriksaan lingkungan: jalankan `npm run doctor` sebelum mulai. */
import fs from 'node:fs';
import path from 'node:path';
import { PROJECT_ROOT, DATA_DIR, loadConfig, parameters } from '../server/lib/config.js';
import { accounts, paths } from '../server/lib/store.js';
import * as git from '../server/lib/git.js';

const line = (label, value, ok = true) => console.log(`  ${ok ? '✓' : '✗'} ${label.padEnd(26)} ${value}`);
const warn = (label, value) => console.log(`  ! ${label.padEnd(26)} ${value}`);

console.log('\n  GitHub Changer — doctor\n  ─────────────────────────────────────────────');
const cfg = loadConfig();
const env = await git.environment(cfg);

line('Node.js', `${process.version} (${process.platform}/${process.arch})`, Number(process.versions.node.split('.')[0]) >= 18);
line('Project root', PROJECT_ROOT);
line('Data dir', fs.existsSync(DATA_DIR) ? DATA_DIR : `${DATA_DIR} (dibuat saat server start)`, true);
line('Platform', env.isWindows ? `Windows (${env.platform})` : env.platform);
line('Git binary', env.git.ok ? `${env.git.path} · ${env.git.version}` : env.git.error, env.git.ok);
line('GIT_ASKPASS', fs.existsSync(env.askpass) ? env.askpass : 'TIDAK ADA', fs.existsSync(env.askpass));
line('Host autentikasi', cfg.git.authHost);
line('GitHub CLI', env.gh.ok ? env.gh.version : 'opsional, tidak terinstal', true);
line('Server', `http://${cfg.server.host}:${cfg.server.port}`);
line('OAuth Client ID', cfg.auth.clientId ? `${cfg.auth.clientId.slice(0, 10)}…` : 'BELUM DIATUR', Boolean(cfg.auth.clientId));
line('Email diizinkan', cfg.auth.allowedEmails.length ? cfg.auth.allowedEmails.join(', ') : 'semua (multi-akun)');
line('Akun tersimpan', String(accounts.count()));
line('Token terenkripsi', fs.existsSync(paths.SECRET_FILE) || process.env.APP_SECRET ? 'kunci ada' : 'kunci dibuat saat akun pertama login', true);
const overridden = parameters().filter((p) => p.source !== 'default');
line('Parameter diubah', overridden.length ? overridden.map((p) => p.path).join(', ') : 'semua default');

console.log('\n  Root project:');
for (const root of env.roots) {
  const ok = root.exists && root.isDir && root.writable;
  console.log(`  ${ok ? '✓' : '✗'} ${root.path}${root.real && root.real !== root.path ? ` → ${root.real}` : ''}${ok ? '' : ` (${root.error || 'tidak bisa ditulis'})`}`);
  if (ok) {
    try {
      // Scan per-root, jangan tampilkan total semua root berulang kali.
      const oneRoot = { ...cfg, workspace: { ...cfg.workspace, roots: [root.path] } };
      const repos = await git.scanRepos(oneRoot);
      line('  Repository terdeteksi', `${repos.length} repo di root ini`);
    } catch (error) { warn('  Scan gagal', error.message); }
  }
}

console.log('\n  Saran:');
if (path.basename(PROJECT_ROOT).toLowerCase() === path.basename(path.dirname(PROJECT_ROOT)).toLowerCase()) {
  warn('Folder bersarang', `${PROJECT_ROOT} → sebaiknya isinya dipindah ke ${path.dirname(PROJECT_ROOT)} (README → Windows/XAMPP)`);
}
if (!cfg.auth.clientId) warn('Login GitHub', 'isi auth.clientId di halaman Parameters atau GITHUB_CLIENT_ID di .env');
if (!env.git.ok) warn('Git', env.isWindows
  ? 'instal Git for Windows, atau set git.binary = C:\\Program Files\\Git\\cmd\\git.exe (bisa lewat .env: GHC_GIT_BINARY)'
  : 'instal Git atau atur parameter git.binary ke path yang benar');
if (cfg.server.host === '0.0.0.0' && !process.env.APP_PIN) warn('Keamanan', 'server terbuka ke LAN — pertimbangkan APP_PIN atau bind 127.0.0.1');
console.log('  ✓ Jalankan app dengan: npm start\n');
