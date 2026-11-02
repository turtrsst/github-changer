#!/usr/bin/env node
/**
 * GIT_ASKPASS helper.
 *
 * Git memanggil script ini dengan satu argumen berisi prompt, mis:
 *   "Username for 'https://github.com':"
 *   "Password for 'https://x-access-token@github.com':"
 *
 * Kita jawab dengan kredensial OAuth milik akun GitHub yang sedang aktif.
 * Token HANYA lewat environment variable GHC_GIT_TOKEN (tidak pernah lewat
 * argumen / URL remote), sehingga tidak bocor ke log atau `git remote -v`.
 */
'use strict';

const prompt = (process.argv[2] || '').toLowerCase();
const token = process.env.GHC_GIT_TOKEN || '';
const allowedHost = (process.env.GHC_GIT_HOST || 'github.com').toLowerCase();

if (/user(name)?/.test(prompt)) {
  // Username hanya dikirim untuk host yang diizinkan.
  process.stdout.write(prompt.includes(allowedHost) ? 'x-access-token' : '');
} else {
  // Jangan pernah kirim token ke host selain GitHub (prompt Git memuat host-nya).
  // Kalau prompt tidak memuat host sama sekali, tetap diam (fail-closed).
  process.stdout.write(prompt.includes(allowedHost) ? token : '');
}
